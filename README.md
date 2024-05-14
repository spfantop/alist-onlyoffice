## 简要说明

#### 自己随便写的，不提供任何咨询，感兴趣可以自己研究

参考项目：

[https://github.com/xbeeant/oo-chinese-license](https://github.com/xbeeant/oo-chinese-license)

[https://github.com/alist-org/alist/discussions/3899](https://github.com/alist-org/alist/discussions/3899)

[https://api.onlyoffice.com/zh/editors/basic](https://api.onlyoffice.com/zh/editors/basic)

[https://alist.nn.ci/zh/config/configuration.html](https://alist.nn.ci/zh/config/configuration.html)

[https://github.com/zsxsoft/onlyoffice-siyuan](https://github.com/zsxsoft/onlyoffice-siyuan)

###### 简要步骤：

1. config.json文件配置修改
2. 安装nodejs
3. node www运行
4. alist iframe 配置:
   > {
    > 	"doc,docx,xls,xlsx,ppt,pptx,pdf": {
    >                 "预览-inner": "https://office.com/view?src=$e_url",
    >                 "编辑-inner": "https://office.com/edit?src=$e_url"
    > 	}
    > }
    >
