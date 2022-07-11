import _ from "lodash";
import { updateConfigFile } from "./config.mjs";
import { SSH, genPwd } from "./utils.mjs";

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
  let extraFiles = [];
  if (site.dumpFileZip) {
    dumpFile = getFnameFromZip(site.dumpFileZip);
  }
  if (site.wpContentZip) {
    wpContent = getFnameFromZip(site.wpContentZip);
  }
  if (site.extraFiles && Array.isArray(site.extraFiles)) {
    extraFiles = site.extraFiles;
  }

  if (site.dumpFileZip || site.wpContentZip) {
    client.sshKusanagi(
      `mkdir -p /home/kusanagi/${site.profile}/DocumentRoot/zips`
    );
  }

  const commands = [];
  commands.push(`cd /home/kusanagi/${site.profile}/DocumentRoot;`);
  if (site.dumpFileZip) {
    client.uploadKusanagi(
      site.dumpFileZip,
      `/home/kusanagi/${site.profile}/DocumentRoot/zips/`
    );
    commands.push(`cd zips;`);
    commands.push(`unzip -o ${dumpFile}.zip;`);
    commands.push(`mv ${dumpFile}.sql ../;`);
    commands.push(`cd ../;`);
  }
  if (site.wpContentZip) {
    client.uploadKusanagi(
      site.wpContentZip,
      `/home/kusanagi/${site.profile}/DocumentRoot/zips/`
    );
    commands.push(`cd zips;`);
    commands.push(`unzip -o ${wpContent}.zip;`);
    commands.push(`cp -af ${wpContent}/* ../wp-content/;`);
    commands.push(`cd ../;`);
  }
  commands.push(`rm -rf zips;`);

  extraFiles.forEach(({ zip, destination }) => {
    client.uploadKusanagi(zip, destination);
    const fname = getFnameFromZip(zip);
    commands.push(`cd ${destination};`);
    commands.push(`unzip -o ${destination}${fname}.zip;`);
    commands.push(`rm -rf ${destination}${fname}.zip;`);
  });

  client.sshKusanagi(commands.join(" "));
};

const performInstall = (config, site) => {
  const client = new SSH(config);

  let dumpFile = null;
  if (site.dumpFileZip) {
    dumpFile = getFnameFromZip(site.dumpFileZip);
  }

  const commands = [];
  commands.push(`cd /home/kusanagi/${site.profile}/DocumentRoot;`);
  commands.push(
    `wp config create --dbname=${site.dbname} --dbuser=${site.dbuser} --dbpass=${site.dbpass};`
  );
  commands.push(`wp db drop --yes;`);
  commands.push(`wp db create;`);
  let url = `http://${config.ec2.host}`;
  if (site.path && site.path.length > 0) {
    url = `${url}/${site.path}`;
  }

  const adminpwd = genPwd();
  if (site.dumpFileZip) {
    commands.push(`wp db import ${dumpFile}.sql;`);
    commands.push(
      `wp option get home | xargs -I{} wp search-replace {} ${url};`
    );
    commands.push(
      `wp option get siteurl | xargs -I{} wp search-replace {} ${url};`
    );
    commands.push(`wp core update-db;`);
    if (site.wpuser && site.adminemail) {
      commands.push(`wp user create ${site.wpuser} ${site.adminemail} --role=administrator --user_pass=${adminpwd};`);
    }
  } else {
    commands.push(
      `wp core install --url=${url} --title=${site.profile} --admin_user=${site.wpuser} --admin_password=${adminpwd} --admin_email=${site.adminemail};`
    );
  }

  if (site.customSearchReplace && Array.isArray(site.customSearchReplace)) {
    site.customSearchReplace.forEach(({ pattern, replacement }) => {
      commands.push(`wp search-replace ${pattern} ${replacement};`);
    })
  }

  client.sshKusanagi(commands.join(" "));

  client.sshCentos(`
    cd /home/kusanagi/${site.profile};
    [ -f ./DocumentRoot/wp-config.php ] && cd DocumentRoot || cd ./;
    sudo chmod 777 wp-config.php;
  `);
  client.sshKusanagi(`
    cd /home/kusanagi/${site.profile}/DocumentRoot;
    wp config set --type=constant FS_METHOD \'ftpext\';
    wp config set --type=constant FTP_HOST \'localhost\';
    wp config set --type=constant FTP_USER \'kusanagi\';
  `);

  return {
    ...site,
    wppass: adminpwd,
  }
};

const updatePermissions = (config, site) => {
  const client = new SSH(config);

  let extra = '';
  if (site.permissionsUpdateTargets && Array.isArray(site.permissionsUpdateTargets)) {
    extra = `sudo chown -R httpd:www ${site.permissionsUpdateTargets.join(' ')};`;
  }
  client.sshCentos(`
    cd /home/kusanagi/${site.profile};
    [ -f ./DocumentRoot/wp-config.php ] && sudo mv ./DocumentRoot/wp-config.php ./ || sudo mv ./wp-config.php ./;
    sudo chown kusanagi:www wp-config.php;
    sudo chmod 440 wp-config.php;
    sudo chmod 755 DocumentRoot/wp-content;
    cd DocumentRoot/wp-content;
    sudo chmod 644 index.php advanced-cache.php replace-class.php;
    sudo chmod 755 translate-accelerator;
    sudo chown -R httpd:www replace-class.php translate-accelerator uploads/*; ${extra}
  `);
};


export const wpInstall = (config) => {
  const ccopy = _.cloneDeep(config);
  [config.rootsite, ...config.subsites].forEach((site, i) => {
    prepareFiles(config, site);
    const updateds = performInstall(config, site);
    if (i === 0) {
      ccopy.rootsite = updateds;
    } else {
      ccopy.subsites[i - 1] = updateds;
    }
    updateConfigFile(ccopy);
    updatePermissions(config, site);
  });
};
