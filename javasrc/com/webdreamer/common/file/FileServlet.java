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

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import javax.servlet.http.Part;
import org.apache.log4j.Logger;

@WebServlet(name = "FileOpreateServlet", urlPatterns = "/fileServlet")
@MultipartConfig(maxFileSize = 10 * 1020 * 1024)
public class FileServlet extends HttpServlet {

    private static final Logger log = Logger.getLogger(FileServlet.class);
    private static final long serialVersionUID = 1L;
    private static String FILE_BASE_DIR = "";

    private static final String PARAM_FILE_OPERATE_TYPE = "operateType";
    private static final String PARAM_FILE_RELATIVE_PATH = "path";

    private static final String PARAM_FILE_OPERATE_READ = "read";
    private static final String PARAM_FILE_OPERATE_DELETE = "deleteFile";
    private static final String PARAM_FILE_OPERATE_SAVE = "save";
    private static final String PARAM_FILE_OPERATE_CONTENT = "content";
    private static final String PARAM_FILE_OPERATE_UPDATE = "update";
    private static final String PARAM_FILE_OPERATE_CREATE_FILE = "createFile";

    private static final String PARAM_DIR_OPERATE_CREATE = "createDir";
    private static final String PARAM_DIR_OPERATE_GET_SUB_DIRECTORY = "getSubDirs";
    private static final String PARAM_DIR_OPERATE_DELETE = "deleteDir";

    private static final String UPLOAD_FILE = "upload";
    private static final String UPLOAD_FILE_SAVE_PATH = "savePath";
    private static final String PARAM_DIR_OPERATE_COPY = "copyDir";
    private static final String PARAM_DIR_OPERATE_GET_FILES = "getFiles";

    public void doGet(HttpServletRequest request, HttpServletResponse response) {
        doPost(request, response);
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) {
        String fileOprateType = request.getParameter(PARAM_FILE_OPERATE_TYPE);
        try {
            request.setCharacterEncoding("UTF-8");
            response.setCharacterEncoding("UTF-8");
            PrintWriter out = response.getWriter();
            if (PARAM_FILE_OPERATE_READ.equals(fileOprateType)) {
                String path = FILE_BASE_DIR
                        + request.getParameter(PARAM_FILE_RELATIVE_PATH).replace("\\", File.separator);
                out.print(FileUtil.readFile(path));
            } else if (PARAM_FILE_OPERATE_SAVE.equals(fileOprateType)
                    || PARAM_FILE_OPERATE_UPDATE.endsWith(fileOprateType)) {
                String path = FILE_BASE_DIR
                        + request.getParameter(PARAM_FILE_RELATIVE_PATH).replace("\\", File.separator);
                String content = request.getParameter(PARAM_FILE_OPERATE_CONTENT);
                out.print(FileUtil.saveToFile(path, content));
            } else if (PARAM_DIR_OPERATE_GET_SUB_DIRECTORY.equals(fileOprateType)) {
                String path = FILE_BASE_DIR
                        + request.getParameter(PARAM_FILE_RELATIVE_PATH).replace("\\", File.separator);
                out.print(FileUtil.getSubDirList(path));
            } else if (PARAM_DIR_OPERATE_CREATE.equals(fileOprateType)) {
                String path = FILE_BASE_DIR
                        + request.getParameter(PARAM_FILE_RELATIVE_PATH).replace("\\", File.separator);
                out.print(FileUtil.makeDir(path));
            } else if (PARAM_DIR_OPERATE_DELETE.equals(fileOprateType)) {
                String path = FILE_BASE_DIR
                        + request.getParameter(PARAM_FILE_RELATIVE_PATH).replace("\\", File.separator);
                out.print(FileUtil.deleteDirectory(path));
            } else if (UPLOAD_FILE.equals(fileOprateType)) {
                boolean result = this.uploadFile(request, response);
                out.print(result);
            } else if (PARAM_FILE_OPERATE_DELETE.equals(fileOprateType)) {
                String path = FILE_BASE_DIR
                        + request.getParameter(PARAM_FILE_RELATIVE_PATH).replace("\\", File.separator);
                out.print(FileUtil.deleteFile(path));
            } else if (PARAM_DIR_OPERATE_COPY.equals(fileOprateType)) {
                String formPath = FILE_BASE_DIR + request.getParameter("from");
                String toPath = FILE_BASE_DIR + request.getParameter("to");
                out.print(FileUtil.copyDir(formPath, toPath, ".cvs"));
            } else if (PARAM_DIR_OPERATE_GET_FILES.equals(fileOprateType)) {
                String dirPath = FILE_BASE_DIR + File.separator + request.getParameter(PARAM_FILE_RELATIVE_PATH);
                out.print(FileUtil.getFilesOfDir(dirPath));

            }

        } catch (Exception e) {
            log.error(e.getMessage());
        }

    }

    public void init(ServletConfig config) throws ServletException {
        FILE_BASE_DIR = config.getServletContext().getRealPath("/");

    }

    private boolean uploadFile(HttpServletRequest request, HttpServletResponse response)

    {
        try {
            String uploadPath = request.getParameter(UPLOAD_FILE_SAVE_PATH);
            if (uploadPath == null || uploadPath.trim().equals("")) {
                log.error("Upload file not specified file save path.");
                return false;
            }
            uploadPath = uploadPath.replace("/", "\\");

            String savePath = FILE_BASE_DIR + File.separator + request.getParameter(UPLOAD_FILE_SAVE_PATH);
            if (savePath != null && !savePath.trim().equals("")) {
                request.setCharacterEncoding("utf-8");
                Part part = request.getPart("file");
                String h = part.getHeader("content-disposition");
                if (!FileUtil.makeDir(savePath)) {
                    log.error("Upload file crate dir error.");
                    return false;
                }
                String filename = h.substring(h.lastIndexOf("=") + 2, h.length() - 1);
                part.write(savePath + File.separator + filename);
                return true;
            } else {
                return false;
            }

        } catch (Exception e) {
            // TODO Auto-generated catch block
            log.error("Upload file error..." + e.getMessage());
            return false;
        }

    }
}
