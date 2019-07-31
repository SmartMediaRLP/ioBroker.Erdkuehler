'use strict';
const adapterName = require('./io-package.json').common.name;
const utils = require('@iobroker/adapter-core'); // Get common adapter utils

const _request = require('request');
const Library = require(__dirname + '/lib/library.js');


let adapter;
let library;


/*
 * ADAPTER
 *
 */
function startAdapter(options)
{
	options = options || {};
	Object.assign(options,
	{
		name: adapterName
	});
	
	adapter = new utils.Adapter(options);
	library = new Library(adapter);
	
	/*
	 * ADAPTER READY
	 *
	 */
	adapter.on('ready', function()
	{
		// check settings
		if (!adapter.config.ip)
		{
			adapter.log.warn('IP not configured! Please go to settings and fill in IP.');
			return;
		}
		
		// create buttons & subscribe
		library.set({node: 'move_up', role: 'button', type: 'boolean', description: 'Move Bierlift up'});
		library.set({node: 'move_down', role: 'button', type: 'boolean', description: 'Move Bierlift down'});
		adapter.subscribeStates('move_*');
	});

	/*
	 * STATE CHANGE
	 *
	 */
	adapter.on('stateChange', function(id, state)
	{
		adapter.log.debug('State of ' + id + ' has changed ' + JSON.stringify(state) + '.');
		
		if (!state.ack)
		{
			let action = id.substr(id.lastIndexOf('.')+1);
			let url = 'http://' + adapter.config.ip.replace('http://', '') + ':' + (adapter.config.port || '88') + '/action?Dir=' + (action == 'move_up' ? 'High' : 'Low') + '&Delay=' + (adapter.config.delay || 325) + '&Steps=' + (adapter.config.steps || 70000);
			
			adapter.log.debug('Request URL for action ' + action + ': ' + url);
			_request(url, function (error, response, body)
			{
				adapter.log.debug('Successfully applied ' + action + '.');
			});
		}
	});
	
	/*
	 * ADAPTER UNLOAD
	 *
	 */
	adapter.on('unload', function(callback)
	{
		try
		{
			adapter.log.info('Adapter stopped und unloaded.');
			callback();
		}
		catch(e)
		{
			callback();
		}
	});

	return adapter;	
};


/*
 * COMPACT MODE
 * If started as allInOne/compact mode => return function to create instance
 *
 */
if (module && module.parent)
	module.exports = startAdapter;
else
	startAdapter(); // or start the instance directly
