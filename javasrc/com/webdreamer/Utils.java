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
package com.webdreamer;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.apache.log4j.Logger;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.taskdefs.Delete;
import org.apache.tools.ant.taskdefs.Jar;
import org.apache.tools.ant.types.FileSet;

public class Utils {

    private static final Logger logger = Logger.getLogger(Utils.class);

    public static String join(String[] strings, String separator) {
        if (strings == null || strings.length == 0)
            return "";
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < strings.length; i++) {
            builder.append(strings[i]);
            if (i < strings.length - 1)
                builder.append(separator);
        }
        return builder.toString();
    }

    public static boolean inArray(String[] array, String value) {
        if (array == null || array.length == 0)
            return false;
        for (int i = 0; i < array.length; i++) {
            if (value == null)
                return array[i] == null;
            else if (value.equals(array[i]))
                return true;
        }
        return false;
    }

    public static String insertBeforeEachLine(String content, String inserted) {
        return content.replaceAll("\\n", "\n" + inserted);
    }

    public static boolean isNullOrEmpty(String str) {
        return str == null || str.isEmpty();
    }

    public static boolean isNullOrTrimEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    /**
     * Safe trim() function, return empty if string is null.
     */
    public static String trim(String str) {
        return str == null ?  "" : str.trim();
    }

    public static String formatTime(Date date) {
        SimpleDateFormat sdf = new SimpleDateFormat("YYYY-MM-dd HH:mm:ss");
        return sdf.format(date);
    }

    public static boolean jarPackage(String packagePath, String jarPath) {
        try {
            Project prj = new Project();
            Jar jar = new Jar();
            jar.setProject(prj);
            jar.setDestFile(new File(jarPath));
            FileSet fileSet = new FileSet();
            fileSet.setProject(prj);
            fileSet.setDir(new File(packagePath));
            fileSet.setIncludes("**/*.class");
            jar.addFileset(fileSet);
            jar.execute();
        } catch (Exception e) {
            logger.error(e);
            return false;
        }
        return true;
    }

    public static boolean makeWar(String folderDir, String targetWarPath) {

        Delete delete = new Delete();
        Delete deleteDir = new Delete();
        File tagetFile = new File(targetWarPath);
        File baseDirFile = new File(folderDir);
        Jar jar = new Jar();
        Project project = new Project();

        try {
            delete.setProject(project);
            delete.setFile(tagetFile);
            delete.execute();

            jar.setProject(project);
            jar.setTaskType("jar");
            // jar.set
            jar.setEncoding("UTF-8");
            jar.setBasedir(baseDirFile);
            jar.setDestFile(tagetFile);
            jar.execute();
        } catch (Exception e) {
            logger.error(e);
            return false;
        } finally {
            try {
                deleteDir.setDir(baseDirFile);
                deleteDir.setProject(project);
                deleteDir.setRemoveNotFollowedSymlinks(true);
                deleteDir.setIncludeEmptyDirs(true);
                deleteDir.execute();
            } catch (Exception e) {
                logger.error(e);
            } finally {
                jar = null;
                delete = null;
                deleteDir = null;
                tagetFile = null;
                baseDirFile = null;
                project = null;

            }

        }
        return true;
    }
}
