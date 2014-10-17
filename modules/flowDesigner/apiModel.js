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
/**
 * manage the api instance data in flow model
 * @module apiModel
 */
define(["util"], function (util) {
    var API_TYPE_JS_API = "SERVICE";
    var API_TYPE_XLT_API = "XLT";
    var API_TYPE_SP_API = "SPAPI";

    function ApiBean() {
    }

    ApiBean.prototype = {
        aid: "",
        name: "",
        displayName: "",
        type: "SERVICE",            //SERVICE,  XLT,  SPAPI
        dataType: "JSON",  //JSON, XML
        provider: "",            //ex. System
        className: "",
        functionName: "",
        params: [],
        icon: "",
        invokeFuncName: "",     //function name to invoke this api instance
        suffixNumber: 1,
        code: "",
        Plugin: ""        //for xlt api
    };

    var _apiBeans = [];

    function getApiIndex(aid) {
        for (var i = 0; i < _apiBeans.length; i++) {
            if (_apiBeans[i].aid == aid)
                return i;
        }
        return -1;
    }


    return {

        load: function (data) {
            this.clear();
            _apiBeans = data;
        },

        toData: function () {
            // return _apiBeans;
            var data = [];
            for (var i = 0; i < _apiBeans.length; i++) {
                data.push(_apiBeans[i]);
            }
            return data;
        },

        getApi: function (aid) {
            var index = getApiIndex(aid);
            return index > -1 ? _apiBeans[index] : null;
        },

        /**
         *  add a api  instance
         * @param apiName
         * @param provider
         * @param className
         * @param functionName
         * @param params
         * @param iconPath
         * @returns {ApiBean}
         */
        addApi: function (apiName, provider, className, functionName, params, iconPath) {
            var bean;
            if (typeof apiName == "object") {
                bean = apiName;
            } else {
                bean = new ApiBean();
                bean.name = apiName;
                bean.provider = provider;
                bean.className = className || "";
                bean.functionName = functionName;
                bean.params = params || [];
                bean.icon = iconPath || "";
            }
            if (!bean.name || !bean.functionName)
                return null;
            bean.displayName = bean.displayName || bean.name;
            bean.type = bean.type || "SERVICE";
            bean.dataType = bean.dataType || "JSON";
            bean.aid = "api" + (_apiBeans.length + 1) + util.uuid(6);


            var suffixNumber = _apiBeans.length + 1;
            while (true) {
                var hasSame = false;
                for (var i = 0; i < _apiBeans.length; i++) {
                    var other = _apiBeans[i];
                    if (other.className == bean.className && other.functionName == bean.functionName && other.suffixNumber == suffixNumber) {
                        hasSame = true;
                        break;
                    }
                }
                if (!hasSame)
                    break;
                else
                    suffixNumber = suffixNumber * 10 + 2;
            }
            var funcDeclareName;
            if (bean.className)
                funcDeclareName = bean.className + "_" + bean.functionName + suffixNumber;
            else
                funcDeclareName = bean.functionName + suffixNumber;
            var funDeclareHeader = "function " + funcDeclareName + "(" + bean.params.join(",") + ")";
            var funSuccessCallbackDeclareHeader = "function " + bean.functionName + suffixNumber + "_normal(result)";
            var funErrorCallbackDeclareHeader = "function " + bean.functionName + suffixNumber + "_error(message)";
            bean.invokeFuncName = funcDeclareName;
            bean.suffixNumber = suffixNumber;

            var classVarName = "v" + bean.className + suffixNumber;
            var callFuncName;
            if (bean.className)
                callFuncName = classVarName + "." + bean.functionName;
            else
                callFuncName = bean.functionName;
            var param = bean.params.join(",");
            param += bean.functionName + suffixNumber + "_normal" + "," + bean.functionName + suffixNumber + "_error";

            var code;
            if (bean.className) {
                code = String.format("//Do Not Remove This Function Prototype\n" +
                    "{0}\n{\n var {1} = new {2}();\n try{\n {3}({4}); \n}\n catch(e)\n{\n " +
                    "alert(\"Function error. Message: \" + (e instanceof Error ? e.message : e) );\n}\n}\n",
                    funDeclareHeader, classVarName, bean.className, callFuncName, param);

                if (bean.className == 'Timer') {

                    bean.sysPlugin = {};
                    bean.sysPlugin.Dialog = null;
                    bean.sysPlugin.para = "";
                    bean.sysPlugin.openDialog = sysPluginApiPara[ bean.className]  [bean.functionName ].openDialog;

                    if (bean.functionName == 'setInterval' || bean.functionName == 'setTimeout') {
                        classVarName = "Timer_Objs[" + suffixNumber + "]";
                        callFuncName = classVarName + "." + bean.functionName;

                        code = String.format("//Do Not Remove This Function Prototype\n" +
                            "{0}\n{\n {1} = new {2}();\n try{\n {3}({4}); \n}\n catch(e)\n{\n " +
                            "alert(\"Function error. Message: \" + (e instanceof Error ? e.message : e) );\n}\n}\n",
                            funDeclareHeader, classVarName, bean.className, callFuncName, param);
                    }
                }
            } else {
                code = String.format("//Do Not Remove This Function Prototype\n" +
                    "{0}\n{\n  try{\n {1}({2}); \n}\n catch(e)\n{\n alert(\"Function error. Message: \" + (e instanceof Error ? e.message : e) );\n}\n}\n",
                    funDeclareHeader, bean.functionName, param);
            }
            code += "\n" + funSuccessCallbackDeclareHeader + "\n{\n" +
                "}\n\n" + funErrorCallbackDeclareHeader + "\n{\n" +
                "alert(\" " + bean.functionName + " communication error! \"+message);\n}\n";

            bean.code = code;

            _apiBeans.push(bean);
            return  bean;
        },

        deleteApi: function (aid) {
            var index = getApiIndex(aid);
            if (index == -1)
                return false;
            _apiBeans.splice(index, 1);
            return true;
        },

        clear: function () {
            _apiBeans = [];
        },

        _dump: function () {
            console.debug("api beans: %o", _apiBeans);
        }
    };
});
