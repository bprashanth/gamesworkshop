// Keep shared competitive URLs and the scenario selector usable as deep links.
if(new URLSearchParams(location.search).get('scenario')==='sentences'){
 const url=new URL('sentences.html',location.href);url.search=location.search;location.replace(url);
}else{
 await import('./competitive.js');
 await import('./shared-map.js');
}
