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
import java.io.FileReader;

import net.sf.json.JSONObject;

import org.apache.log4j.Logger;

/**
 * common operate file class
 */
public class FileUtil {

	private final static Logger LOG = Logger.getLogger(FileUtil.class);

	public final static String FILE_OPRATE_FLAG = "result";
	public final static String FILE_OPRATE_OK = "ok";
	public final static String FILE_OPRATE_ERROR = "error";

	public final static String FILE_OPRATE_DATA_FLAG = "data";

	/**
	 * Read content of the specific file
	 * 
	 * @param path
	 * @return JSONObject of content of file
	 */
	public static JSONObject readFile(String path) {

		JSONObject data = new JSONObject();
		if (path != null && path.trim().equals("")) {
			LOG.error("File path is null or empety string");
			data.accumulate(FILE_OPRATE_FLAG, FILE_OPRATE_ERROR);
			data.accumulate(FILE_OPRATE_DATA_FLAG, "file path is empty");

		} else {
			File file = new File(path);
			BufferedReader br = null;
			StringBuffer sb = new StringBuffer();
			if (file.exists() && file.isFile()) {
				try {
					br = new BufferedReader(new FileReader(file));
					String record = new String();
					sb = new StringBuffer();
					while ((record = br.readLine()) != null) {
						sb.append(record);
					}
					data.accumulate(FILE_OPRATE_FLAG, FILE_OPRATE_OK);
					data.accumulate(FILE_OPRATE_DATA_FLAG, sb.toString());
				} catch (Exception e) {
					LOG.error("Read file error [" + e.getMessage() + "]");
					data.accumulate(FILE_OPRATE_FLAG, FILE_OPRATE_ERROR);
					data.accumulate(FILE_OPRATE_DATA_FLAG, "read file error");
				} finally {

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
				LOG.error("[" + path + "] file not exist.");
				data.accumulate(FILE_OPRATE_FLAG, FILE_OPRATE_ERROR);
				data.accumulate(FILE_OPRATE_DATA_FLAG, "file not exist");
			}
		}
		return data;
	}
}
