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

  commands.push(`kusanagi nginx --reload;`);

  client.sshKusanagi(commands.join(' '));
};
