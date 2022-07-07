import { SSH } from "./utils.mjs";

/**
 * Configures Nginx to properly route subdirs to their corresponding WordPress install
 */
export const nginxConfigure = (config) => {
  const client = new SSH(config);

  const commands = [];
  commands.push("cd /etc/opt/kusanagi/nginx/conf.d;");
  config.subsites.forEach((subsite) => {
    commands.push(
      `echo \\"upstream ${subsite.name} { server 127.0.0.1; }\\" > ${subsite.name}.upstream.conf;`
    );
    
    client.sshCentos(`sudo sed -i '/root\\\s\\/home\\/kusanagi\\/${config.rootsite.name}\\/DocumentRoot/a "location ^~ /${subsite.name}/ { \\nproxy_pass http://${subsite.name}/ \\n}"' /etc/opt/kusanagi/nginx/conf.d/${config.rootsite.name}.conf`);
  });
  commands.push("kusanagi nginx --reload;");

  client.sshCentos(`sudo su - -c '${commands.join(" ")}'`);
};
