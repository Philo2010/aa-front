<script>
  import Router from 'svelte-spa-router';

  import Home from './routes/Home.svelte';
  import About from './routes/About.svelte';
  import Login from './routes/Login.svelte';
  import Test from './routes/Test.svelte';
  import GetWarningBox from './lib/GetWarningBox.svelte';
  import NotAllowed from './routes/NotAllowed.svelte';

  //paths for admin
  import IndexAdmin from './routes/admin/IndexAdmin.svelte';
  import LeaderBoard from './routes/admin/LeaderBoard.svelte';
  import PasswordReset from './routes/admin/PasswordReset.svelte';
  import SendWarning from './routes/admin/SendWarning.svelte';
  import SetEvent from './routes/admin/SetEvent.svelte';
  import SubScout from './routes/admin/SubScout.svelte';
  import PitSelect from './routes/pit/PitSelect.svelte';
  import Queue from './routes/admin/Queue.svelte';
  import QueuePlayoff from './routes/admin/QueuePlayoff.svelte';
  import PitAssign from './routes/pit/PitAssign.svelte';
  import PitInsert from './routes/pit/PitInsert.svelte';
  import PitGet from './routes/pit/PitGet.svelte';
  import PitEdit from './routes/pit/PitEdit.svelte';


  const routes = {
    '/': Home,
    '/about': About,
    '/login': Login,
    '/test': Test,
    '/admin': IndexAdmin,
    '/admin/leaderboard': LeaderBoard,
    '/admin/passwordreset': PasswordReset,
    '/admin/sendwarning': SendWarning,
    '/admin/setevent': SetEvent,
    '/admin/subscout': SubScout,
    '/admin/queue': Queue,
    '/admin/queueplayoff': QueuePlayoff,
    '/notallowed': NotAllowed,
    '/pit/select': PitSelect,
    '/pit/assign': PitAssign,
    '/pit/get': PitGet,
    '/pit/insert': PitInsert,
    '/pit/edit': PitEdit
  };
</script>

<Router {routes} />
<GetWarningBox />