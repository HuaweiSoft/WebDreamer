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
package com.webdreamer.servlets;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import com.webdreamer.builder.HtmlGenerator;

@SuppressWarnings("serial")
@WebServlet(name = "BuildAppServlet", urlPatterns = "/buildApp")
public class BuildAppServlet extends HttpServlet {
    private static final Logger LOG = Logger.getLogger(BuildAppServlet.class);

    // parameters form request
    private static final String PROJECT = "project";
    private static final String DEFAULT_PROJECT = "test";
    private static final String USER = "user";
    private static final String DEFAULT_USER = "guest";

    public BuildAppServlet() {
        super();
    }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        this.doPost(request, response);
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String project = request.getParameter(PROJECT);
        if (project == null) {
            project = DEFAULT_PROJECT;
        }

        String user = request.getParameter(USER);
        if (user == null) {
            user = DEFAULT_USER;
        }
        String ROOT_PATH = getServletContext().getRealPath("/");
        HtmlGenerator htmlGenerator = new HtmlGenerator();
        boolean result = htmlGenerator.generate(user, project, ROOT_PATH, true, null);
        out.print("generate html code success: " + result);
    }
}
