import _ from "lodash";
import { SSH } from "./utils.mjs";

export const getFnameFromZip = (zipFile) => {
  let pieces = zipFile.split("/");
  let lastpart = pieces[pieces.length - 1];
  pieces = lastpart.split(".zip");
  pieces.pop();
  return pieces.join("");
};

const prepareFiles = (config, site) => {
  const client = new SSH(config);

  let dumpFile = null;
  let wpContent = null;
  if (site.dumpFileZip) {
    dumpFile = getFnameFromZip(site.dumpFileZip);
  }
  if (site.wpContentZip) {
    wpContent = getFnameFromZip(site.wpContentZip);
  }

  const commands = [];
  commands.push(`cd /home/kusanagi/${site.fullname}/DocumentRoot;`);
  if (site.dumpFileZip) {
    commands.push(`cd zips;`);
    commands.push(`unzip -o ${dumpFile}.zip;`);
    commands.push(`mv ${dumpFile}.sql ../;`);
    commands.push(`cd ../;`);
  }
  if (site.wpContentZip) {
    commands.push(`cd zips;`);
    commands.push(`unzip -o ${wpContent}.zip;`);
    commands.push(`cp -af ${wpContent}/* ../wp-content/;`);
    commands.push(`cd ../;`);
  }
  commands.push(`rm -rf zips;`);

  client.sshKusanagi(commands.join(" "));
};

const performInstall = (config, site) => {
  const client = new SSH(config);

  let dumpFile = null;
  if (site.dumpFileZip) {
    dumpFile = getFnameFromZip(site.dumpFileZip);
  }

  const commands = [];
  commands.push(`cd /home/kusanagi/${site.fullname}/DocumentRoot;`);
  commands.push(
    `wp config create --dbname=${site.dbname} --dbuser=${site.dbuser} --dbpass=${site.dbpass};`
  );
  commands.push(`wp db drop --yes;`);
  commands.push(`wp db create;`);
  if (site.dumpFileZip) {
    commands.push(`wp db import ${dumpFile}.sql;`);
    commands.push(`wp option get home | xargs -I{} wp search-replace {} http://${site.url};`);
    commands.push(`wp option get siteurl | xargs -I{} wp search-replace {} http://${site.url};`);
    commands.push(`wp core update-db;`);
  }

  client.sshKusanagi(commands.join(' '));
};

const updatePermissions = (config, site) => {
  const client = new SSH(config);

  client.sshCentos(`
    cd /home/kusanagi/${site.fullname}/DocumentRoot;
    sudo chown httpd:www wp-config.php;
    sudo chmod 666 wp-config.php;
  `);
};

export const wpInstall = (config) => {
  const client = new SSH(config);

  [config.rootsite, ...config.subsites].forEach((site) => {
    if (site.dumpFileZip || site.wpContentZip) {
      client.sshKusanagi(
        `mkdir -p /home/kusanagi/${site.fullname}/DocumentRoot/zips`
      );
    }

    if (site.dumpFileZip) {
      client.uploadKusanagi(
        site.dumpFileZip,
        `/home/kusanagi/${site.fullname}/DocumentRoot/zips/`
      );
    }

    if (site.wpContentZip) {
      client.uploadKusanagi(
        site.wpContentZip,
        `/home/kusanagi/${site.fullname}/DocumentRoot/zips/`
      );
    }

    prepareFiles(config, site);
    performInstall(config, site);
    updatePermissions(config, site);
  });
};
