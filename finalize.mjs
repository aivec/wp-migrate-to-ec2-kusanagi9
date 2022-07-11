import { SSH } from "./utils.mjs";

/**
 * Configures SSL
 */
export const finalize = (config) => {
  const client = new SSH(config);

  const commands = [];
  commands.push(`kusanagi configure --fqdn ${config.domain} ${config.rootsite.profile};`);
  commands.push(`kusanagi ssl --email ${config.email} --https redirect --auto on ${config.rootsite.profile};`);

  [config.rootsite, ...config.subsites].forEach((site) => {
    let url = `https://${config.domain}`;
    if (site.path && site.path.length > 0) {
      url = `${url}/${site.path}`;
    }

    commands.push(`cd /home/kusanagi/${site.profile}/DocumentRoot;`);
    commands.push(
      `wp option get home | xargs -I{} wp search-replace {} ${url};`
    );
    commands.push(
      `wp option get siteurl | xargs -I{} wp search-replace {} ${url};`
    );
  })

  const rootcs = [];
  rootcs.push('cd /etc/opt/kusanagi/nginx/conf.d;');
  config.subsites.forEach((site) => {
    rootcs.push(`
      sudo sed -i 's/server_name\\\s${site.profile};/server_name ${site.profile}_ssl;/g' ${site.profile}.conf;
      sudo sed -i '0,/server_name\\\s${site.profile}_ssl;/{s/server_name\\\s${site.profile}_ssl;/server_name ${site.profile};/}' ${site.profile}.conf;
      sudo sed -i 's/https:\\/\\/${site.profile}\\$request_uri/https:\\/\\/${site.profile}_ssl\\$request_uri/' ${site.profile}.conf;
      sudo sed -i 's/#rewrite/rewrite/' ${site.profile}.conf;
    `)
  });

  client.sshKusanagi(commands.join(' '));
  client.sshCentos(rootcs.join(' '));

  client.sshKusanagi('kusanagi nginx --reload;');
};
