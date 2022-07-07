import _ from "lodash";
import { generate } from "generate-password";
import { updateConfigFile } from "./config.mjs";
import { SSH, genPwd } from "./utils.mjs";

export const provision = (config) => {
  const utils = new SSH(config);

  const dbpass = genPwd();

  const outjson = _.cloneDeep(config);

  utils.sshKusanagi(
    `kusanagi provision --wp --wplang ja --fqdn ${config.ec2.host} --no-email --dbname ${config.rootsite.dbname} --dbuser ${config.rootsite.dbuser} --dbpass '${dbpass}' '${config.rootsite.name}'`
  );

  outjson.rootsite.dbpass = dbpass;
  outjson.rootsite.fullname = config.rootsite.name;
  outjson.rootsite.url = config.ec2.host;
  updateConfigFile(outjson);

  config.subsites.forEach((subsite, i) => {
    const fullname = `${config.rootsite.name}-${subsite.name}`;
    const subdbpass = genPwd();
    utils.sshKusanagi(
      `kusanagi provision --wp --wplang ja --fqdn ${subsite.name} --no-email --dbname ${subsite.dbname} --dbuser ${subsite.dbuser} --dbpass '${subdbpass}' '${fullname}'`
    );

    outjson.subsites[i].dbpass = subdbpass;
    outjson.subsites[i].fullname = fullname;
    outjson.subsites[i].url = `${config.ec2.host}/${subsite.name}`;
    updateConfigFile(outjson);
  });
};
