import Cookies from 'js-cookie';

export function checkadmin(): boolean {
	let res = Cookies.get('is_admin');

	if (res) {
		//check value
		if (res === 'true') {
			return true;
		} else {
			return false;
		}
	} else {
		//not logined in, but we are not checking if we are logined in so i dont care
		return false;
	}

	return false;
}
