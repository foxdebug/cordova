/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');
const { networkInterfaces } = require('os');
const { parseStringPromise, Builder } = require('xml2js');

module.exports = async (mode = 'dev') => {
  const configXml = path.resolve('config.xml');
  const config = fs.readFileSync(configXml, 'utf-8');
  const configJson = await parseStringPromise(config);
  const { WiFi, en1 } = getIp();
  const ip = WiFi?.length ? WiFi[0] : en1;
  const port = '5500';
  const src = `https://${ip || '10.0.0'}:${port}`;

  configJson.widget.platform.forEach((platform) => {
    if (mode === 'dev') {
      platform.content = [{ $: { src } }];
    } else if (platform.content) {
      delete platform.content;
    }
  });

  const builder = new Builder({
    renderOpts: {
      indent: '    ',
      pretty: true,
    },
  });
  const newConfig = builder.buildObject(configJson);
  fs.writeFileSync(configXml, newConfig);
  return { ip, port };
};

function getIp() {
  const nets = networkInterfaces();
  const results = {}; // Or just '{}', an empty object

  Object.keys(nets).forEach((name) => {
    nets[name].forEach((net) => {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyV4Value && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    });
  });
  return results;
}
