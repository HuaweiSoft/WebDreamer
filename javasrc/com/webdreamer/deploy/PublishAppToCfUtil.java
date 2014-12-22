/*******************************************************************************
 *     Web Dreamer
 *     Copyright (c) Huawei Technologies Co., Ltd. 1998-2014. All Rights Reserved.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *          http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *******************************************************************************/
package com.webdreamer.deploy;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipFile;

import org.apache.log4j.Logger;
import org.cloudfoundry.client.lib.CloudCredentials;
import org.cloudfoundry.client.lib.CloudFoundryClient;
import org.cloudfoundry.client.lib.StartingInfo;
import org.cloudfoundry.client.lib.UploadStatusCallback;
import org.cloudfoundry.client.lib.archive.ZipApplicationArchive;
import org.cloudfoundry.client.lib.domain.CloudApplication;
import org.cloudfoundry.client.lib.domain.Staging;
import org.json.JSONArray;
import org.springframework.security.oauth2.common.OAuth2AccessToken;

import com.webdreamer.Utils;
import com.webdreamer.builder.HtmlGenerator;
import com.webdreamer.common.ControlMetadata;
import com.webdreamer.common.ProjectFormModel;
import com.webdreamer.common.file.FileUtil;

public class PublishAppToCfUtil {

    private final static Logger logger = Logger.getLogger(PublishAppToCfUtil.class);
    private static Map<String, ArrayList<String>> STATUS_MAP = new HashMap<String, ArrayList<String>>();

    public static void putMsg(String uuid, String msg) {
        String putmsg = Utils.formatTime(new Date()) + ":" + msg;
        ArrayList<String> msgList = STATUS_MAP.get(uuid);
        if (msgList == null) {
            ArrayList<String> list = new ArrayList<String>();
            list.add(putmsg);
            STATUS_MAP.put(uuid, list);
        } else {
            msgList.add(putmsg);
        }
    }

    public static JSONArray getMsg(String uuid) {
        JSONArray array = new JSONArray();
        ArrayList<String> msgList = STATUS_MAP.get(uuid);
        if (msgList != null && msgList.size() > 0) {
            for (int i = 0; i < msgList.size(); i++) {
                array.put(msgList.get(i));
            }
        }
        return array;
    }

    public static void clearMsg(String uuid) {
        STATUS_MAP.remove(uuid);
    }

    public static void deploy(String warpath, String uuid, String user, String userpsd, String target, String space,
            String appURL, String name) {

        logger.info("Start login create app ");

        putMsg(uuid, "Start to create app.");
        CloudFoundryClient client = null;
        try {

            CloudCredentials credentials = new CloudCredentials(user, userpsd);

            client = new CloudFoundryClient(credentials, URI.create(target).toURL(), user.concat("-org"), space);
            client.login();
            OAuth2AccessToken token = client.login();

            if (token == null) {
                logger.error(user.concat(" login cf error......"));
                putMsg(uuid, "Login to cloudfoundry error.");

            } else {

                List<String> uris = new ArrayList<String>();
                uris.add(appURL);
                try {
                    client.deleteApplication(name);
                } catch (Exception e) {

                }
                boolean created = false;
                try {
                    client.createApplication(name, new Staging(), 128, uris, new ArrayList());
                    putMsg(uuid, "Create app success.");
                    created = true;
                } catch (Exception e) {
                    logger.error(e);
                    putMsg(uuid, "Create app error." + e.toString().replace(e.toString().split(":")[0], ""));
                }
                if (created) {
                    putMsg(uuid, "Start to deploy app package.");
                    boolean uploadAppWarResult = uploadAppWar(client, warpath, name, uuid);
                    if (uploadAppWarResult) {
                        putMsg(uuid, "App package has been deployed.");
                        putMsg(uuid, "Ready for starting app.");
                        startApp(client, name, uuid);
                    } else {
                        putMsg(uuid, "Deploy app package error.");
                    }
                }
            }

        } catch (Exception e) {
            logger.error(e);
            putMsg(uuid, "Deploy app package error.");

        } finally {
            putMsg(uuid, "Deploy Finished");
            if (client != null) {
                client.logout();
            }
        }

    }

    /**
     * 
     * @param client
     * @param warPath
     * @param appName
     * @return boolean
     */
    private static boolean uploadAppWar(CloudFoundryClient client, String warPath, String appName, final String uuid) {

        try {

            File warFile = new File(warPath);
            if (!warFile.exists() || !warFile.isFile()) {
                putMsg(uuid, "Publishing progress " + warPath + " not exist.");
                return false;
            }

            client.uploadApplication(appName, new ZipApplicationArchive(new ZipFile(warPath)),
                    new UploadStatusCallback() {
                        @Override
                        public void onCheckResources() {

                        }

                        @Override
                        public void onMatchedFileNames(Set<String> matchedFileNames) {

                        }

                        @Override
                        public void onProcessMatchedResources(int length) {

                        }

                        @Override
                        public boolean onProgress(String status) {
                            logger.info("Upload application war progress: " + status);
                            putMsg(uuid, "Deploy progress " + status);
                            return false;
                        }
                    });
        } catch (IOException e) {
            logger.error("Upload application war error: " + e);
            putMsg(uuid, "Publishing progress deploy package error.");
            return false;
        }

        if (STATUS_MAP.get(uuid).size() > 0) {
            for (int i = 0; i < STATUS_MAP.get(uuid).size(); i++) {
                if (STATUS_MAP.get(uuid).get(i).indexOf("Deploy progress finished") > -1) {
                    return true;
                }
            }
            return false;
        } else {
            return false;
        }
    }

    private static void startApp(CloudFoundryClient client, String appName, String uuid) {

        try {
            putMsg(uuid, "Starting app, please wait for some minutes...");
            client.startApplication(appName);
            CloudApplication app = client.getApplication(appName);
            Boolean success = app.getState() == CloudApplication.AppState.STARTED;
            if (success) {
                putMsg(uuid, "Start app success.");
            } else {
                putMsg(uuid, "Start app fail.");
            }

        } catch (Exception e) {
            logger.error("Start app error", e);
            putMsg(uuid, "Start app fail.");
        }
    }

    public static boolean makeWar(String rootPath, String userName, String projectName, String uuid, String proxy,
            boolean record) {

        if (record) {
            PublishAppToCfUtil.putMsg(uuid, "Copying file...");
        }
        /** 1 copy configure file ***/
        String tmpDir = rootPath + File.separator + uuid + File.separator + projectName;
        FileUtil.copyFileAndReplace(rootPath + File.separator + "data" + File.separator + "tmpl" + File.separator
                + "web.xml", tmpDir + File.separator + "WEB-INF", "projectName", projectName);
        FileUtil.copyFileAndReplace(rootPath + File.separator + "data" + File.separator + "tmpl" + File.separator
                + "log4j.properties", tmpDir + File.separator + "WEB-INF" + File.separator + "classes", "projectName",
                projectName);
        FileUtil.saveToFile(tmpDir + File.separator + "WEB-INF" + File.separator + "classes" + File.separator
                + "proxy.json", proxy);

        /** 2 copy jar **/
        String packageJarStr = FileUtil.readFile(rootPath + File.separator + "data" + File.separator + "tmpl"
                + File.separator + "packagejars.json");
        try {
            JSONArray jarArray = new JSONArray(packageJarStr);
            for (int i = 0; i < jarArray.length(); i++) {
                FileUtil.copyFile(rootPath + File.separator + "WEB-INF" + File.separator + "lib" + File.separator
                        + jarArray.getString(i), tmpDir + File.separator + "WEB-INF" + File.separator + "lib");
            }
        } catch (Exception e) {
            logger.error(e);
        }
        FileUtil.copyDir(rootPath + File.separator + "WEB-INF" + File.separator + "classes" + File.separator + "com"
                + File.separator + "webdreamer" + File.separator + "serviceInvoker", tmpDir + File.separator
                + "WEB-INF" + File.separator + "classes" + File.separator + "com" + File.separator + "webdreamer"
                + File.separator + "serviceInvoker", "**/*.java");

        Utils.jarPackage(tmpDir + File.separator + "WEB-INF" + File.separator + "classes", tmpDir + File.separator
                + "WEB-INF" + File.separator + "lib" + File.separator + "restserviceinvoker.jar");

        FileUtil.deleteDirectory(tmpDir + File.separator + "WEB-INF" + File.separator + "classes" + File.separator
                + "com");

        /** generate HTML and JS file */
        HtmlGenerator htmlGenerator = new HtmlGenerator();
        htmlGenerator.generate(userName, projectName, rootPath, false, tmpDir);
        ProjectFormModel model = htmlGenerator.getProjectFormModel();

        /** copy all depend CSS files */
        if (model.getCss().size() > 0) {
            for (int i = 0; i < model.getCss().size(); i++) {
                String cssFile = model.getCss().get(i);
                String toDir = cssFile.replace(cssFile.split("/")[cssFile.split("/").length - 1], "");
                FileUtil.copyFile(rootPath + File.separator + cssFile, tmpDir + File.separator + toDir);
               
                String[] cssPathArray = cssFile.split("/");
                String cssImagesPath = rootPath + File.separator
                        + cssFile.replace(cssPathArray[cssPathArray.length - 1], "");
                File cssImagesDir = new File(cssImagesPath + File.separator + "images");
                if (cssImagesDir.exists() && cssImagesDir.isDirectory() && cssImagesDir.listFiles().length > 0) {
                    FileUtil.copyDir(cssImagesDir.getPath(),
                            tmpDir +File.separator+ cssFile.replace(cssPathArray[cssPathArray.length - 1], "")+File.separator+"images", "**/.txt");
                }
            }
        }
        /** copy all depend JS files */
        if (model.getJs().size() > 0) {
            for (int i = 0; i < model.getJs().size(); i++) {
                String jsFile = model.getJs().get(i);
                String toDir = jsFile.replace(jsFile.split("/")[jsFile.split("/").length - 1], "");
                FileUtil.copyFile(rootPath + File.separator + jsFile, tmpDir + File.separator + toDir);
            }
        }
        /** copy all services JS files */
        if (model.getUsedServices() != null && model.getUsedServices().length > 0) {
            for (int i = 0; i < model.getUsedServices().length; i++) {
                String serviceName = model.getUsedServices()[i];
                FileUtil.copyDirBySubFfix(rootPath + File.separator + "services" + File.separator + serviceName, tmpDir
                        + File.separator + "services" + File.separator + serviceName, ".js");
            }
        }

        /** copy controls depend resources */
        if (model.getUsedControlMetadataList().size() > 0) {
            for (int i = 0; i < model.getUsedControlMetadataList().size(); i++) {
                ControlMetadata metadata = model.getUsedControlMetadataList().get(i);
                File srcResouces = new File(rootPath + File.separator + "controls" + File.separator + metadata.dir
                        + File.separator + "resources");
                if (srcResouces.exists() && srcResouces.isDirectory() && srcResouces.listFiles().length > 0) {
                    FileUtil.makeDir(tmpDir + File.separator + "controls" + File.separator + metadata.dir
                            + File.separator + "resources");
                    FileUtil.copyDir(rootPath + File.separator + "controls" + File.separator + metadata.dir
                            + File.separator + "resources", tmpDir + File.separator + "controls" + File.separator
                            + metadata.dir + File.separator + "resources", "**/.cvs");
                }
            }
        }
        /** copy all resources file */
        FileUtil.copyDir(rootPath + File.separator + "data" + File.separator + userName + File.separator + projectName
                + File.separator + "resources", tmpDir + File.separator + "resources", "**/.cvs");
        FileUtil.deleteFile(rootPath + File.separator + "data" + File.separator + userName + File.separator
                + projectName + ".war");
        if (record) {
            PublishAppToCfUtil.putMsg(uuid, "Start to make war file...");
        }
        Utils.makeWar(tmpDir, rootPath + File.separator + "data" + File.separator + userName + File.separator
                + projectName + ".war");
        FileUtil.deleteDirectory(rootPath + File.separator + uuid);
        if (record) {
            PublishAppToCfUtil.putMsg(uuid, "War file has been made successfully.");
        }
        return true;
    }


}
