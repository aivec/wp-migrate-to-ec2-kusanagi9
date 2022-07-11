import { writeFileSync, unlinkSync } from "fs";
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
      `echo \\"upstream ${subsite.profile} { server 127.0.0.1; }\\" > ${subsite.profile}.upstream.conf;`
    );
    commands.push(
      `echo \\"upstream ${subsite.profile}_ssl { server 127.0.0.1:443; }\\" > ${subsite.profile}_ssl.upstream.conf;`
    );

    const ldpath = `nginx-location-directive.${subsite.profile}.txt`;
    writeFileSync(
      ldpath,
      `
    location ^~ /${subsite.path}/ {
        proxy_pass http://${subsite.profile}/;
    }
    `
    );
    const ldpathssl = `nginx-location-directive.${subsite.profile}_ssl.txt`;
    writeFileSync(
      ldpathssl,
      `
    location ^~ /${subsite.path}/ {
        proxy_pass https://${subsite.profile}_ssl/;
    }
    `
    );
    const requripath = `nginx-fastcgi-param.${subsite.profile}.txt`;
    writeFileSync(
      requripath,
      `        fastcgi_param REQUEST_URI /${subsite.path}$request_uri;
`
    );
    client.uploadCentos(ldpath, "./");
    client.uploadCentos(ldpathssl, "./");
    client.uploadCentos(requripath, "./");
    client.sshCentos(`
      sudo mv /home/centos/${ldpath} /etc/opt/kusanagi/nginx/conf.d/;
      sudo mv /home/centos/${ldpathssl} /etc/opt/kusanagi/nginx/conf.d/;
      sudo mv /home/centos/${requripath} /etc/opt/kusanagi/nginx/conf.d/;
      cd /etc/opt/kusanagi/nginx/conf.d/;
      grep 'proxy_pass http://${subsite.profile}/;' ${config.rootsite.profile}.conf | xargs -I{} [ -z {} ] && sudo sed -i '/listen\\\s80/r ${ldpath}' ${config.rootsite.profile}.conf || echo 'proxy_pass already set';
      sudo rm ${ldpath};
      grep 'proxy_pass https://${subsite.profile}_ssl/;' ${config.rootsite.profile}.conf | xargs -I{} [ -z {} ] && sudo sed -i '/listen\\\s443/r ${ldpathssl}' ${config.rootsite.profile}.conf || echo 'proxy_pass already set';
      sudo rm ${ldpathssl};
      grep 'fastcgi_param REQUEST_URI /${subsite.path}' ${subsite.profile}.wp.inc | xargs -I{} [ -z {} ] && sudo sed -i '0,/conf.d\\/fastcgi.inc/!b;//r ${requripath}' ${subsite.profile}.wp.inc || echo 'fastcgi_param REQUEST_URL already set';
      sudo rm ${requripath};
    `);
    unlinkSync(ldpath);
    unlinkSync(ldpathssl);
    unlinkSync(requripath);
  });

  commands.push("kusanagi nginx --reload;");
  client.sshCentos(`sudo su - -c '${commands.join(" ")}'`);
};
