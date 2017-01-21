const fs = require('fs');
const Plugin = require('./Plugin');

let readConfig = function(pluginId) {
	return new Promise((resolve, reject) => {
		fs.readFile(`./app/plugins/${pluginId}/manifest.json`, function read(err, data) {
			if (err) {
				//console.log(err);
				return resolve(null);
			}

			try {
				data = JSON.parse(data);
				data = Object.assign(data, {
					id: pluginId
				});

				return resolve(new Plugin(data));
			} catch(error) {
				//console.warn(error);
			}
		});
	});
};

module.exports = function() {
	return new Promise((resolve, reject) => {
		console.info('\x1b[36m%s\x1b[0m', 'Searching for plugins');

		let pluginCount = 0;

		let pluginMap = new Map();
		let promiseArray = [];

		fs.readdir('./app/plugins', (err, plugins) => {
			plugins.forEach(pluginId => {
				let data = readConfig(pluginId);
				promiseArray.push(data);

				pluginCount++;
			});

			Promise.all(promiseArray)
				.then(values => {
					for(let i = 0, z = values.length; i < z; i++) {
						let plugin = values[i];

						if(plugin.getId()) {
							pluginMap.set(plugin.getId(), plugin);
						}
					}

					return resolve(pluginMap);
				});

			console.info('\x1b[36m%s\x1b[0m', `Found ${pluginCount} plugins`);
		});
	});
};