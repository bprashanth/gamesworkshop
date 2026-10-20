// Legacy entry: the competitive UI is shared by both scenarios.
const url=new URL('../paperweights/web/',location.href);url.search=location.search;url.searchParams.set('scenario','households');if(!url.searchParams.has('mode'))url.searchParams.set('mode','hard');location.replace(url);
