<script>
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Counter from './lib/Counter.svelte'

  import Router from 'svelte-spa-router';

  import Home from './routes/Home.svelte';
  import About from './routes/About.svelte';
  import Login from './routes/Login.svelte';
  import Insert from './routes/pitExample/Insert.svelte'

  const routes = {
    '/': Home,
    '/about': About,
    '/login': Login,
    '/insert': Insert
};
</script>

<nav>
  <a href="#/">Home</a>
  <a href="#/about">About</a>
</nav>

<Router {routes} />
