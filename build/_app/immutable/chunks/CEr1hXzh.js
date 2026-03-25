async function n(){const t=await fetch("/api/get_event");if(!t.ok)throw new Error(`Request failed with status ${t.status}: ${t.statusText}`);return(await t.json()).message}export{n as g};
