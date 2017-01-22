var fetch = require('node-fetch');
var FormData = require('form-data');
const fs = require('fs');
const crypto = require('crypto');

const JwtHelper = require('./JwtHelper');


class LoginHelper {
    constructor(socketHelper) {
        if(socketHelper.getDatabaseHelper) {
            this.socketHelper = socketHelper;
            this.jwtHelper = new JwtHelper(socketHelper);
        }
    }

    loginToken(server, authtoken) {
		if(this.socketHelper) {
		    this.jwtHelper.validate(authtoken).then((data) => {

		    	console.log('validated', data);

				let loginData = {
					server: server,
					username: data.username,
					id: data.id,
					token: authtoken
				};

				this.parseLoginInfo(loginData);

				if(this.$login) {
					this.$login(loginData);
				}
            }).catch((error) => {
				console.warn('setted token', error);

                if(this.$unauthorized) {
                    this.$unauthorized(error);
                }
            });
		}
    }

    loginCredentials(server, username, password) {
        if(this.socketHelper) {
            username = username.toLowerCase();

			this.socketHelper.getDatabaseHelper().query({
			    sql: "SELECT * FROM `users` WHERE `username`=? LIMIT 0,1",
                values: [username]
			}).then((data) => {
			    if(data.rows && data.rows[0] && data.rows[0].digesta1 == this.getDigesta(username, password)) {
					let row = data.rows[0];

					if(row.username && row.id) {
						this.isLoggedIn = true;

						this.jwtHelper.get(server, row.id, row.username).then((token) => {
							let loginData = {
								server: server,
								username: row.username,
								id: row.id,
								token: token
							};

							this.parseLoginInfo(loginData);

							if (this.$login) {
								this.$login(loginData);
							}
                        });
					}
                }

                return Promise.reject();
			}).catch((error) => {
				if(this.$unauthorized) {
					this.$unauthorized();
				}
            });
        }
    }

    getDigesta(username, password) {
        return crypto.createHash('md5').update(`${username.toLowerCase()}:SabreDAV:${password}`).digest('hex');
    }

    on(type, callback) {
        switch (type) {
            case 'login':
                this.$login = callback;
                break;
            case 'unauthorized':
                this.$unauthorized = callback;
                break;
            default: break;
        }
    }

    parseLoginInfo(data) {
    	if(data.id && data.token && data.server) {
    		this.currentUser = this.socketHelper.getUserHelper().getUser(data.id);

    		if(this.currentUser) {
				this.username = this.currentUser.getUsername();
				this.token = data.token;
				this.server = data.server;
				this.id = this.currentUser.getId();

				this.currentUser.addSocket( this.socketHelper.getSocket().id );
			}
		}
    }

    getId() {
        return this.id;
    }

    getServer() {
        return this.server;
    }

    getUsername() {
        return this.username;
    }

    getToken() {
        return this.token;
    }

	setToken(token) {
		this.token = token;
	}
}

module.exports = LoginHelper;