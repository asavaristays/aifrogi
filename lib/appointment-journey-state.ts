import type { AppointmentInboundEvent } from "@/lib/appointment-journey-contract";

export const APPOINTMENT_SESSION_STATUS = {
  IDLE: "IDLE",
  SERVICE_SELECT: "SERVICE_SELECT",
  COLLECT_NAME: "COLLECT_NAME",
  SLOT_SELECT: "SLOT_SELECT",
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  CONFIRMED: "CONFIRMED",
  HANDOFF: "HANDOFF"
} as const;

export type AppointmentSessionStatus = (typeof APPOINTMENT_SESSION_STATUS)[keyof typeof APPOINTMENT_SESSION_STATUS];

export type AppointmentServiceOption = {
  id: string;
  name: string;
  durationMin: number;
  priceInr: number;
};

export type AppointmentState = {
  status: AppointmentSessionStatus;
  selectedServiceId?: string | null;
  customerName?: string | null;
  selectedSlotStartIso?: string | null;
  offeredSlots?: string[];
  retryCount?: number;
};

export type AppointmentTenantConfig = {
  razorpayEnabled: boolean;
  services: AppointmentServiceOption[];
};

export type AppointmentAction =
  | { type: "send_service_list"; services: AppointmentServiceOption[] }
  | { type: "ask_customer_name"; serviceId: string }
  | { type: "send_slot_list"; serviceId: string; customerName: string; slots?: string[] }
  | { type: "create_hold"; serviceId: string; customerName: string; slotStartIso: string }
  | { type: "create_payment_link"; serviceId: string; customerName: string; slotStartIso: string }
  | { type: "confirm_without_payment"; serviceId: string; customerName: string; slotStartIso: string }
  | { type: "release_hold" }
  | { type: "handoff_to_inbox"; reason: string }
  | { type: "send_reprompt"; message: string };

export type AppointmentTransition = {
  nextState: AppointmentState;
  actions: AppointmentAction[];
};

function payloadText(event: AppointmentInboundEvent) {
  return String(event.payload.text || "").trim();
}

function replyId(event: AppointmentInboundEvent) {
  return String(event.payload.reply_id || event.payload.id || "").trim();
}

function isCancel(event: AppointmentInboundEvent) {
  return payloadText(event).toLowerCase() === "cancel" || replyId(event).toLowerCase() === "cancel";
}

function serviceExists(config: AppointmentTenantConfig, serviceId: string) {
  return config.services.some((service) => service.id === serviceId);
}

function selectedServiceId(event: AppointmentInboundEvent, config: AppointmentTenantConfig) {
  const value = replyId(event) || payloadText(event);
  if (serviceExists(config, value)) return value;
  const optionIndex = Number.parseInt(value, 10) - 1;
  if (Number.isInteger(optionIndex) && config.services[optionIndex]) return config.services[optionIndex].id;
  const byName = config.services.find((service) => service.name.toLowerCase() === value.toLowerCase());
  return byName?.id || "";
}

function slotFromReply(reply: string) {
  if (!reply.startsWith("slot_")) return "";
  const value = reply.slice("slot_".length);
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function selectedSlot(event: AppointmentInboundEvent, offeredSlots: string[] = []) {
  const value = replyId(event) || payloadText(event);
  const encoded = slotFromReply(value);
  if (encoded) return encoded;
  const optionIndex = Number.parseInt(value, 10) - 1;
  if (Number.isInteger(optionIndex) && offeredSlots[optionIndex]) return offeredSlots[optionIndex];
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function reprompt(state: AppointmentState, message: string): AppointmentTransition {
  const retryCount = (state.retryCount ?? 0) + 1;
  if (retryCount >= 2) {
    return {
      nextState: { ...state, status: APPOINTMENT_SESSION_STATUS.HANDOFF, retryCount },
      actions: [{ type: "handoff_to_inbox", reason: "Customer input did not match the appointment flow." }]
    };
  }
  return { nextState: { ...state, retryCount }, actions: [{ type: "send_reprompt", message }] };
}

export function transitionAppointmentState(input: {
  state: AppointmentState;
  event: AppointmentInboundEvent;
  config: AppointmentTenantConfig;
}): AppointmentTransition {
  const { state, event, config } = input;

  if (isCancel(event)) {
    return {
      nextState: { status: APPOINTMENT_SESSION_STATUS.IDLE, retryCount: 0 },
      actions: [{ type: "release_hold" }]
    };
  }

  if (state.status === APPOINTMENT_SESSION_STATUS.IDLE || state.status === APPOINTMENT_SESSION_STATUS.CONFIRMED) {
    return {
      nextState: { status: APPOINTMENT_SESSION_STATUS.SERVICE_SELECT, retryCount: 0 },
      actions: [{ type: "send_service_list", services: config.services }]
    };
  }

  if (state.status === APPOINTMENT_SESSION_STATUS.SERVICE_SELECT) {
    const serviceId = selectedServiceId(event, config);
    if (!serviceId) {
      return reprompt(state, "Please choose one of the services from the list.");
    }
    return {
      nextState: {
        status: APPOINTMENT_SESSION_STATUS.COLLECT_NAME,
        selectedServiceId: serviceId,
        retryCount: 0
      },
      actions: [{ type: "ask_customer_name", serviceId }]
    };
  }

  if (state.status === APPOINTMENT_SESSION_STATUS.COLLECT_NAME) {
    const customerName = payloadText(event);
    if (customerName.length < 2) {
      return reprompt(state, "Please send the customer name for this appointment.");
    }
    return {
      nextState: {
        ...state,
        status: APPOINTMENT_SESSION_STATUS.SLOT_SELECT,
        customerName,
        retryCount: 0
      },
      actions: [{ type: "send_slot_list", serviceId: state.selectedServiceId || "", customerName }]
    };
  }

  if (state.status === APPOINTMENT_SESSION_STATUS.SLOT_SELECT) {
    const slotStartIso = selectedSlot(event, state.offeredSlots);
    if (!slotStartIso || !state.selectedServiceId || !state.customerName) {
      return reprompt(state, "Please select one of the available appointment slots.");
    }

    const holdAction: AppointmentAction = {
      type: "create_hold",
      serviceId: state.selectedServiceId,
      customerName: state.customerName,
      slotStartIso
    };

    if (config.razorpayEnabled) {
      return {
        nextState: {
          ...state,
          status: APPOINTMENT_SESSION_STATUS.AWAITING_PAYMENT,
          selectedSlotStartIso: slotStartIso,
          retryCount: 0
        },
        actions: [
          holdAction,
          {
            type: "create_payment_link",
            serviceId: state.selectedServiceId,
            customerName: state.customerName,
            slotStartIso
          }
        ]
      };
    }

    return {
      nextState: {
        ...state,
        status: APPOINTMENT_SESSION_STATUS.CONFIRMED,
        selectedSlotStartIso: slotStartIso,
        retryCount: 0
      },
      actions: [
        holdAction,
        {
          type: "confirm_without_payment",
          serviceId: state.selectedServiceId,
          customerName: state.customerName,
          slotStartIso
        }
      ]
    };
  }

  if (state.status === APPOINTMENT_SESSION_STATUS.AWAITING_PAYMENT) {
    return {
      nextState: state,
      actions: [{ type: "send_reprompt", message: "Your appointment slot is held. Please complete the payment link or type cancel." }]
    };
  }

  return {
    nextState: state,
    actions: [{ type: "handoff_to_inbox", reason: "Appointment session reached a handoff state." }]
  };
}
