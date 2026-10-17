// Deterministic transport only. The production crawler's URL inventory,
// HTML extraction and database capture remain real in the journey test.
exports.fetchPublicWebsiteText=async function(url){
 if(!String(url).startsWith('https://synthetic-business.invalid'))throw Error('EXTERNAL_IO_FORBIDDEN');
 if(globalThis.__syntheticCrawlFault)throw Error('Website returned HTTP 503.');
 const path=new URL(url).pathname;
 if(path==='/robots.txt')return 'User-agent: *\nDisallow: /private\n';
 if(path==='/sitemap.xml')return '<urlset><url><loc>https://synthetic-business.invalid/services</loc></url><url><loc>https://synthetic-business.invalid/contact</loc></url><url><loc>https://synthetic-business.invalid/private</loc></url></urlset>';
 const pages={
 '/':'<title>Synthetic Business</title><h1>Synthetic Business</h1><p>Synthetic Business develops custom applications for service businesses. We work from an agreed project scope and provide implementation support. Our team reviews customer requirements before preparing a proposal.</p><a href="/services">Services</a><a href="/contact">Contact</a>',
 '/services':'<title>Application services</title><h1>Custom applications</h1><p>We develop custom applications for service businesses. Our applications support iOS and Android. We review requirements and agree the delivery scope before work begins. Project prices depend on the agreed scope and are provided on request.</p>',
 '/contact':'<title>Contact</title><h1>Contact our team</h1><p>Our public email is hello@synthetic-business.invalid. Our public phone is +91 98765 43210. Our office address is Suite 10, Example Business Centre, Goa. Contact our team to discuss a proposal, project scope or implementation support.</p>',
 '/private':'<title>Private customer data</title><p>SECRET PRIVATE MATERIAL MUST NEVER BE FETCHED</p>'};
 if(!pages[path])throw Error('Website returned HTTP 404.');
 globalThis.__syntheticCrawlRequests??=[];globalThis.__syntheticCrawlRequests.push(path);
 return pages[path];
};
