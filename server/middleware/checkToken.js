


module.exports = (req, res, next) => {


    const serverCSRFToken = req.csrfToken;

    console.log(req.headers)
    console.log(req.get('XSRF-TOKEN'))
    /*
    const cookies = req.headers.cookies.split(';');
    let csrfToken = null;

    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');

        if (name === 'XSRF-TOKEN') {
            csrfToken = value;
            break; // Stop searching once the token is found
        }
    }
    const clientCSRFToken = csrfToken;
    console.log(serverCSRFToken);

    if (!clientCSRFToken || clientCSRFToken !== serverCSRFToken) {
        return res.status(403).send('Invalid CSRF token');
    }*/

    //next();
};