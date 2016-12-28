const PluginHelper  = require('./PluginHelper.js');
const SearchHelper  = require('./SearchHelper.js');
const UploadHelper  = require('./UploadHelper.js');
const fs            = require('fs');

class SocketHelper {
    constructor(socket) {
        this.uploadHelper = new UploadHelper(this);
        this.pluginHelper = new PluginHelper(this);
        this.searchHelper = new SearchHelper();
        this.socket = socket;


        socket.on('plugins', this.getPlugins.bind(this));

        socket.on('plugin', this.getPlugin.bind(this));

        socket.on('search', this.getSearch.bind(this));

        socket.on('upload', this.upload.bind(this));

        socket.on('disconnect', this.disconnect.bind(this));
    }

    register(loginHelper, user) {
        this.pluginHelper.setLoginHelper(loginHelper);
        this.searchHelper.setLoginHelper(loginHelper);
        this.loginHelper = loginHelper;
        this.user = user;
    }

    disconnect() {
        console.log('disconnected');
        this.uploadHelper.removeAll();
    }

    getPlugins(data) {
        if(data == 'true') {
            this.pluginHelper.getPlugins(this.user).then((data) => {
                this.socket.emit('plugins', data);
            });
        }
    }

    getPlugin(data) {
        console.log('requestPlugin', data);

        if(data && data.name) {
            this.pluginHelper.getPlugin(data.name, data.view, data.param, data.formData).then((response) => {
                this.socket.emit('plugin', {
                    request: data,
                    response: response
                });
            });
        }
    }

    getSearch(data) {
        console.log(data);

        if(data && data.query) {
            this.searchHelper.getSearch(data.query).then((response) => {
                this.socket.emit('search', {
                    request: data,
                    response: response
                });
            });
        }
    }

    getLoginHelper() {
        return this.loginHelper;
    }

    getUploadHelper() {
        return this.uploadHelper;
    }

    upload(data) {
        let name = data.name;

        try {
            fs.mkdirSync('temp/' + this.user.id);
        } catch(e) {
            if ( e.code != 'EEXIST' ) throw e;
        }

        let path = "temp/" + this.user.id + "/" + data.id + "/";

        try {
            fs.mkdirSync(path);
        } catch(e) {
            if ( e.code != 'EEXIST' ) throw e;
        }

        fs.open(path + name, "a", 0o0755, (err, fd) => {
            if(!err) {
                fs.write(fd, data.data, 0, data.data.byteLength, 0, (error) => {
                    if(error == null)
                    fs.close(fd, () => {
                        console.log('closed');
                        this.uploadHelper.setUploaded(data.id, path + name);
                    });

                });
            }
        });
        /* TODO: callback helper as object (multiple instances/different users) */
        console.log('upload', data);
    }
}

module.exports = SocketHelper;