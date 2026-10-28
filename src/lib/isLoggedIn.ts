import Cookies from 'js-cookie';

// The backend sets this cookie on a successful login
// (see `auth::UUID_COOKIE_NAME` in abyss-angel). It is not HttpOnly, so the
// client can read it to tell whether a user is signed in.
export function isLoggedIn(): boolean {
	return !!Cookies.get('uuiduser');
}
