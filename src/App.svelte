<script lang="ts">
  import Counter from './lib/Counter.svelte'

  import Router from 'svelte-spa-router';

  import Home from './routes/Home.svelte';
  import About from './routes/About.svelte';
  import Login from './routes/Login.svelte';
  import Insert from './routes/pitExample/Insert.svelte'
  import Test from './routes/Test.svelte';

  const routes = {
    '/': Home,
    '/about': About,
    '/login': Login,
    '/insert': Insert,
    '/test': Test,
};
</script>

<nav>
  <a href="#/">Home</a>
  <a href="#/test">About</a>
</nav>

<Router {routes} />
