package com.webdreamer.servlets;

import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;

/**
 * Base servlet, provide some common method
 */
public class BaseServlet extends HttpServlet {

    protected String getRootPath() {
		return this.getServletContext().getRealPath("/");
	}

	protected String getProjectPath(String userId, String projectName) {
		return this.getServletContext().getRealPath("/") 	+ "data" + File.separator + userId + File.separator
				+ projectName;
	}

	public static void outputJsonResult(HttpServletResponse response,
			JSONObject result) throws IOException {
		response.setContentType("application/json");
		response.getWriter().print(result.toString());
	}

	public static void outputJsonResult(HttpServletResponse response,
			JSONArray result) throws IOException {
		response.setContentType("application/json");
		response.getWriter().print(result.toString());
	}

	public static void outputJsonResult(HttpServletResponse response,
			String jsonString) throws IOException {
		response.setContentType("application/json");
		response.getWriter().print(jsonString);
	}

	public static void echoError(HttpServletResponse response, int statusCode,
			String message) throws IOException {
		response.setStatus(statusCode);
		response.setContentType("text/plain");
		response.getWriter().print(message);
		response.getWriter().close();
	}

    public static void echoError(HttpServletResponse response, int statusCode) {
        response.setStatus(statusCode);
    }
}
