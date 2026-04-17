---
title: Hello World
abbrlink: 4a17b156
---
Welcome to [Hexo](https://hexo.io/)! This is your very first post. Check [documentation](https://hexo.io/docs/) for more info. If you get any problems when using Hexo, you can find the answer in [troubleshooting](https://hexo.io/docs/troubleshooting.html) or you can ask me on [GitHub](https://github.com/hexojs/hexo/issues).


- `origin/main`：源码
- `origin/gh-pages`：静态网页

步骤很直白：

1. 打开仓库 HEXO1.0
2. 点`Settings`
3. 点左边 `Pages`
4. 找到 `Build and deployment`
5. Source 选 `Deploy from a branch`
6. Branch 选 `gh-pages`
7. 文件夹选 / `(root)`
8. 点 `Save`
9. 等 1 到 5 分钟

10. 打开你的网站，按一次` Ctrl + F5 `强刷

做完这一次后，以后就简单了。

以后手动发布网页：

```
npm run kk
```

以后手动备份源码：
```
```
```
git add . git commit -m "update" git push origin main
```

一句话记：  
先 git push origin main 备份源码，再 npm run kk 发网页。