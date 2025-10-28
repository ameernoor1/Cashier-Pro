(function(){
  try{
    const key = 'cashpro_cache_buster';
    const current = 'v1';
    const stored = localStorage.getItem(key);
    if(stored !== current){
      localStorage.setItem(key, current);
      const tags = [...document.querySelectorAll('link[href],script[src]')];
      tags.forEach(t => {
        const attr = t.tagName === 'LINK' ? 'href' : 'src';
        const url = new URL(t[attr], location.href);
        url.searchParams.set('v', current);
        t[attr] = url.toString();
      });
    }
  }catch(e){}
})();