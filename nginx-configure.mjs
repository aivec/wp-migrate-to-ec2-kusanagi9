import { writeFileSync, unlinkSync } from "fs";
import { SSH } from "./utils.mjs";

/**
 * Configures Nginx to properly route subdirs to their corresponding WordPress install
 */
export const nginxConfigure = (config) => {
  const client = new SSH(config);

  const commands = [];

  const fcgiparamsp = `fastcgi_params.overrides`;
  writeFileSync(
    fcgiparamsp,
    `fastcgi_param REQUEST_URI $request_uri_head$request_uri;
fastcgi_param REMOTE_ADDR $http_x_real_ip;
fastcgi_param SERVER_ADDR $http_x_server_address;
fastcgi_param SERVER_NAME $http_x_forwarded_host;
fastcgi_param HTTP_HOST $http_x_forwarded_host;
`
  );
  client.uploadCentos(fcgiparamsp, "./");
  unlinkSync(fcgiparamsp);
  commands.push(`rm -f /etc/opt/kusanagi/nginx/${fcgiparamsp};`);
  commands.push(`mv /home/centos/${fcgiparamsp} /etc/opt/kusanagi/nginx/;`);

  const proxyparams = `subsite.proxy_pass_params`;
  writeFileSync(
    proxyparams,
    `proxy_set_header X-Server-Address $server_addr;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Host $host;
`
  );
  client.uploadCentos(proxyparams, "./");
  unlinkSync(proxyparams);
  commands.push(`rm -f /etc/opt/kusanagi/nginx/${proxyparams};`);
  commands.push(`mv /home/centos/${proxyparams} /etc/opt/kusanagi/nginx/;`);

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
        include subsite.proxy_pass_params;
        proxy_pass http://${subsite.profile}/;
    }
    `
    );
    const ldpathssl = `nginx-location-directive.${subsite.profile}_ssl.txt`;
    writeFileSync(
      ldpathssl,
      `
    location ^~ /${subsite.path}/ {
        include subsite.proxy_pass_params;
        proxy_pass https://${subsite.profile}_ssl/;
    }
  `
    );
    const requrihead = `nginx-requrihead-set-var.${subsite.profile}.txt`;
    writeFileSync(
      requrihead,
      `
    set $request_uri_head /${subsite.path};
    `
    );

    client.uploadCentos(ldpath, "./");
    client.uploadCentos(ldpathssl, "./");
    client.uploadCentos(requrihead, "./");
    unlinkSync(ldpath);
    unlinkSync(ldpathssl);
    unlinkSync(requrihead);
    client.sshCentos(`
      sudo mv /home/centos/${ldpath} /etc/opt/kusanagi/nginx/conf.d/;
      sudo mv /home/centos/${ldpathssl} /etc/opt/kusanagi/nginx/conf.d/;
      sudo mv /home/centos/${requrihead} /etc/opt/kusanagi/nginx/conf.d/;
      cd /etc/opt/kusanagi/nginx/conf.d/;
      grep 'proxy_pass http://${subsite.profile}/;' ${config.rootsite.profile}.conf | xargs -I{} [ -z {} ] && sudo sed -i '/listen\\\s80/r ${ldpath}' ${config.rootsite.profile}.conf || echo 'HTTP proxy_pass already set';
      sudo rm ${ldpath};
      grep 'proxy_pass https://${subsite.profile}_ssl/;' ${config.rootsite.profile}.conf | xargs -I{} [ -z {} ] && sudo sed -i '/listen\\\s443/r ${ldpathssl}' ${config.rootsite.profile}.conf || echo 'HTTPS proxy_pass already set';
      sudo rm ${ldpathssl};
      grep 'set \\$request_uri_head /${subsite.profile};' ${subsite.profile}.conf | xargs -I{} [ -z {} ] && sudo sed -i '/set\\\s\\$expire_days/r ${requrihead}' ${subsite.profile}.conf || echo '\\$request_uri_head already set';
      sudo rm ${requrihead};
      grep 'include fastcgi_params.overrides;' ${subsite.profile}.wp.inc | xargs -I{} [ -z {} ] && sudo sed -i '/conf.d\\/fastcgi.inc;/a include fastcgi_params.overrides;' ${subsite.profile}.wp.inc || echo 'fastcgi_params.overrides already included';
    `);
  });

  commands.push("kusanagi nginx --reload;");
  client.sshCentos(`sudo su - -c '${commands.join(" ")}'`);
};
