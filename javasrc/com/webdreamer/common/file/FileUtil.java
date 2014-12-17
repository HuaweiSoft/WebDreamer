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
package com.webdreamer.common.file;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.text.SimpleDateFormat;

import org.apache.log4j.Logger;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.taskdefs.Copy;
import org.apache.tools.ant.types.FileSet;
import org.apache.tools.ant.types.FilterSet;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.webdreamer.Utils;

/**
 * Operating file class
 */
public class FileUtil {

    private final static Logger LOG = Logger.getLogger(FileUtil.class);
    private final static String LINE_FEED = "\n";

    /**
     * Get content of the specified file
     * 
     * @param filePath
     * @return
     */
    public static String readFile(String filePath) {
        if (filePath == null || filePath.trim().equals("")) {
            LOG.error("File path is be null or empty");
            return "";

        } else {
            File file = new File(filePath);
            BufferedReader br = null;
            InputStreamReader isr = null;
            FileInputStream fs = null;
            StringBuffer sb = new StringBuffer();
            if (file.exists() && file.isFile()) {
                try {
                    fs = new FileInputStream(file);
                    isr = new InputStreamReader(fs, "UTF-8");
                    br = new BufferedReader(isr);

                    String record = new String();
                    sb = new StringBuffer();
                    while ((record = br.readLine()) != null) {
                        sb.append(record + LINE_FEED);
                    }
                    return sb.toString();
                } catch (Exception e) {
                    LOG.error("Read file error [" + e.getMessage() + "]");
                    return "";

                } finally {

                    if (fs != null) {

                        try {
                            fs.close();
                        } catch (final Exception e) {
                            LOG.error(e);
                        }
                        fs = null;
                    }
                    if (isr != null) {

                        try {
                            isr.close();
                        } catch (final Exception e) {
                            LOG.error(e);
                        }
                        isr = null;
                    }
                    if (br != null) {

                        try {
                            br.close();
                        } catch (final Exception e) {
                            LOG.error(e);
                        }
                        br = null;
                    }

                }
            } else {
                LOG.error("[" + filePath + "] file not exist.");
                return "";
            }
        }

    }

    /**
     * Write string to file
     * 
     * @param filePath
     * @param content
     * @return boolean
     */
    public static boolean saveToFile(String filePath, String content) {
        if (filePath == null || filePath.trim().equals("")) {
            LOG.error("unamed file path");
            return false;
        }
        if (content == null) {
            LOG.error("not defined file content");
            return false;
        }
        boolean hasError = false;
        FileOutputStream fos = null;
        OutputStreamWriter osw = null;
        try {
            fos = new FileOutputStream(filePath);
            osw = new OutputStreamWriter(fos, "UTF-8");
            osw.write(content);
            osw.flush();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
            hasError = true;
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            hasError = true;
        } catch (IOException e) {
            // TODO Auto-generated catch block
            LOG.error(e);
            hasError = true;
        } finally {
            if (osw != null) {
                try {
                    osw.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
                osw = null;
            }

            if (fos != null) {
                try {
                    fos.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
                fos = null;
            }
        }
        return !hasError;
    }

    /**
     * Make directory base on the specified path
     * 
     * @param dirPath
     * @return boolean
     */
    public static boolean makeDir(String dirPath) {

        if (dirPath == null || dirPath.trim().equals("")) {
            return false;
        }
        File dir = new File(dirPath);
        if (!dir.exists())
            return dir.mkdirs();
        else
            return true;
    }

    public static boolean exists(String filePath) {
        return new File(filePath).exists();
    }

    /**
     * Delete the specified file
     * 
     * @param filePath
     * @return {@link JSONObject}
     */
    public static boolean deleteFile(String filePath) {

        if (filePath == null || filePath.trim().equals("")) {
            LOG.debug("File path is null or empty");
            return true;
        }
        File file = new File(filePath);
        if (file.isFile() && file.exists()) {
            return file.delete();
        } else {
            LOG.debug("File not exist.");
            return false;
        }
    }

    /**
     * Deleting the files and sub directory of the specified directory
     * 
     * @param dirPath
     * @return
     */
    public static boolean deleteDirectory(String dirPath) {
        boolean flag = false;
        if (!dirPath.endsWith(File.separator)) {
            dirPath = dirPath + File.separator;
        }
        File dirFile = new File(dirPath);

        if (!dirFile.exists() || !dirFile.isDirectory()) {
            return false;
        }
        flag = true;

        File[] files = dirFile.listFiles();
        for (int i = 0; i < files.length; i++) {

            if (files[i].isFile()) {
                flag = deleteFile(files[i].getAbsolutePath());
                if (!flag)
                    break;
            } else {
                flag = deleteDirectory(files[i].getAbsolutePath());
                if (!flag)
                    break;
            }
        }
        if (!flag)
            return false;

        if (dirFile.delete()) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Copy a specified file to specified directory
     * 
     * @param srcFile
     *            {String} full path of the file need to be copy
     * 
     * @param toDir
     *            {String}full path of the directory need to copy here
     * @return boolean
     */
    public static boolean copyFile(String srcFile, String toDir) {
        try {
            Project prj = new Project();
            Copy copy = new Copy();
            copy.setEncoding("UTF-8");
            copy.setProject(prj);
            copy.setFile(new File(srcFile));
            copy.setTodir(new File(toDir));
            copy.execute();
        } catch (Exception e) {
            LOG.error(e);
            return false;
        }
        return true;
    }

    public static boolean copyFileAndReplace(String srcFile, String toDir, String oldString, String newString) {
        try {
            Project prj = new Project();
            Copy copy = new Copy();
            copy.setEncoding("UTF-8");
            copy.setProject(prj);
            copy.setFile(new File(srcFile));
            copy.setTodir(new File(toDir));
            FilterSet filter = copy.createFilterSet();
            filter.addFilter(oldString, newString);
            copy.setFiltering(true);
            copy.execute();
        } catch (Exception e) {
            LOG.error(e);
            return false;
        }
        return true;
    }

    public static boolean copyDir(String srcDir, String toDir, String excludeFileSubffix) {
        try {
            Project prj = new Project();
            Copy copy = new Copy();
            copy.setEncoding("UTF-8");
            copy.setProject(prj);

            File toDirFile = new File(toDir);
            if (!toDirFile.exists() || toDirFile.isFile()) {
                makeDir(toDir);
            }
            copy.setTodir(toDirFile);

            FileSet fs = new FileSet();
            fs.setProject(prj);
            fs.setDir(new File(srcDir));
            fs.setIncludes("**/*.*");
            fs.setExcludes("**/CVS," + excludeFileSubffix);
            copy.addFileset(fs);
            copy.execute();
        } catch (Exception e) {
            LOG.error(e);
            return false;
        }
        return true;
    }

    public static boolean copyDirBySubFfix(String srcDir, String toDir, String subFfix) {
        try {
            Project prj = new Project();
            Copy copy = new Copy();
            copy.setEncoding("UTF-8");
            copy.setProject(prj);

            copy.setTodir(new File(toDir));

            FileSet fs = new FileSet();
            fs.setProject(prj);
            fs.setDir(new File(srcDir));
            fs.setIncludes("**/*" + subFfix);
            copy.addFileset(fs);
            copy.execute();
        } catch (Exception e) {
            LOG.error(e);
            return false;
        }
        return true;
    }

    /**
     * Get all sub directories of the specified directory
     * 
     * @param direcoryPath
     * @return {@link JSONArray}
     */
    public static JSONArray getSubDirList(String direcoryPath) {

        JSONArray dirList = new JSONArray();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        File file = new File(direcoryPath);
        if (file.exists() && file.isDirectory()) {
            File[] list = file.listFiles();
            for (int i = 0; i < list.length; i++) {
                if (list[i].isDirectory() && !list[i].getName().startsWith(".")
                        && !list[i].getName().toLowerCase().startsWith("cvs")
                        && !list[i].getName().toLowerCase().startsWith("svn")) {
                    JSONObject obj = new JSONObject();

                    try {
                        obj.put("name", list[i].getName());
                        obj.put("time", sdf.format(list[i].lastModified()));
                        dirList.put(obj);
                    } catch (JSONException e) {
                        LOG.error("JSON error", e);
                    }

                }
            }
        }
        return dirList;

    }

    public static JSONArray getFilesOfDir(String directoryPath) {
        JSONArray dirList = new JSONArray();
        File dirFile = new File(directoryPath);
        if (dirFile.exists() && dirFile.isDirectory() && dirFile.listFiles().length > 0) {
            File[] files = dirFile.listFiles();
            for (int i = 0; i < files.length; i++) {
                dirList.put(files[i].getName());
            }
        }
        return dirList;
    }

    public static void main(String[] args) {

        Utils.jarPackage(
                "D:\\E DISK\\code\\cvsworkplace\\webdreamer\\d0f45974-2d66-4996-b14c-16b94d373404\\zqw\\WEB-INF\\classes",
                "D:\\E DISK\\code\\cvsworkplace\\webdreamer\\d0f45974-2d66-4996-b14c-16b94d373404\\zqw\\WEB-INF\\lib\\invoke.jar");
    }
}
