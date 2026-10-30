// Emergency subscription-notice hold; unrelated account/support mail is unchanged.
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function(name, parent, isMain) {
  const value = originalLoad.apply(this, arguments);
  if (name === 'nodemailer' && !value.__aifrogiSubscriptionHold) {
    const originalCreate = value.createTransport;
    value.createTransport = function() {
      const transport = originalCreate.apply(this, arguments);
      const originalSend = transport.sendMail;
      transport.sendMail = function(mail, callback) {
        if (String(mail?.html || '').includes('SUBSCRIPTION NOTICE')) {
          const error = new Error('Subscription reminders are paused by operator instruction.');
          error.code = 'AIFROGI_SUBSCRIPTION_MAIL_HELD';
          if (typeof callback === 'function') { queueMicrotask(() => callback(error)); return; }
          return Promise.reject(error);
        }
        return originalSend.apply(this, arguments);
      };
      return transport;
    };
    value.__aifrogiSubscriptionHold = true;
  }
  return value;
};
