import _ from "lodash";
import { updateConfigFile } from "./config.mjs";
import { SSH, genPwd } from "./utils.mjs";

export const provision = (config) => {
  const utils = new SSH(config);

  const dbpass = genPwd();

  const outjson = _.cloneDeep(config);

  utils.sshKusanagi(
    `kusanagi provision --wp --wplang ja --fqdn ${config.ec2.host} --no-email --dbname ${config.rootsite.dbname} --dbuser ${config.rootsite.dbuser} --dbpass '${dbpass}' '${config.rootsite.profile}'`
  );

  outjson.rootsite.dbpass = dbpass;
  updateConfigFile(outjson);

  config.subsites.forEach((subsite, i) => {
    const subdbpass = genPwd();
    utils.sshKusanagi(
      `kusanagi provision --wp --wplang ja --fqdn ${subsite.profile} --no-email --dbname ${subsite.dbname} --dbuser ${subsite.dbuser} --dbpass '${subdbpass}' '${subsite.profile}'`
    );

    outjson.subsites[i].dbpass = subdbpass;
    updateConfigFile(outjson);
  });
};
