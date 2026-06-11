```
.
├── client
│   ├── app
│   │   ├── (account)
│   │   │   ├── project
│   │   │   │   └── view
│   │   │   │       └── [projectId]
│   │   │   │           └── page.tsx
│   │   │   └── u
│   │   │       └── [username]
│   │   │           ├── layout.tsx
│   │   │           └── page.tsx
│   │   ├── favicon.ico
│   │   ├── features
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── (guestRoutes)
│   │   │   ├── forgot-password
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── reset-password
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── verify
│   │   │   │       ├── layout.tsx
│   │   │   │       └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── signin
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── signup
│   │   │       ├── complete
│   │   │       │   ├── layout.tsx
│   │   │       │   └── page.tsx
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       └── verify
│   │   │           ├── layout.tsx
│   │   │           └── page.tsx
│   │   ├── layout.tsx
│   │   ├── (legal)
│   │   │   ├── about
│   │   │   │   └── page.tsx
│   │   │   ├── contact-us
│   │   │   │   └── page.tsx
│   │   │   ├── privacy-policy
│   │   │   │   └── page.tsx
│   │   │   └── terms-of-service
│   │   │       └── page.tsx
│   │   ├── not-found.tsx
│   │   ├── page.tsx
│   │   ├── (protectedRoutes)
│   │   │   ├── ai-assistant
│   │   │   │   └── [projectId]
│   │   │   │       ├── layout.tsx
│   │   │   │       └── page.tsx
│   │   │   ├── dashboard
│   │   │   │   └── projects
│   │   │   │       ├── layout.tsx
│   │   │   │       └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── project
│   │   │       └── [projectId]
│   │   │           ├── layout.tsx
│   │   │           ├── page.tsx
│   │   │           └── settings
│   │   │               ├── layout.tsx
│   │   │               └── page.tsx
│   │   └── (security)
│   │       └── secure-revoke
│   │           ├── layout.tsx
│   │           └── page.tsx
│   ├── components
│   │   ├── account-password-dialog.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── audience-section.tsx
│   │   ├── auth-provider.tsx
│   │   ├── chat.tsx
│   │   ├── code-editor-section.tsx
│   │   ├── contact-form.tsx
│   │   ├── create-project-dialog.tsx
│   │   ├── create-project-from-github-dialog.tsx
│   │   ├── cta-section.tsx
│   │   ├── editor.tsx
│   │   ├── editor-workspace.tsx
│   │   ├── features-section.tsx
│   │   ├── file-node-context-menu.tsx
│   │   ├── footer.tsx
│   │   ├── guest-route.tsx
│   │   ├── hero-section.tsx
│   │   ├── loader.tsx
│   │   ├── navbar.tsx
│   │   ├── node-action-dialog.tsx
│   │   ├── preview-panel.tsx
│   │   ├── profile-project-card.tsx
│   │   ├── project-card.tsx
│   │   ├── project-menu.tsx
│   │   ├── project-password-dialog.tsx
│   │   ├── protected-route.tsx
│   │   ├── service-worker.tsx
│   │   ├── stack-logos.tsx
│   │   ├── store-provider.tsx
│   │   ├── tech-stack-section.tsx
│   │   ├── terminal-loader.tsx
│   │   ├── terminal.tsx
│   │   ├── ui
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── tooltip.tsx
│   │   └── view-project-workspace.tsx
│   ├── components.json
│   ├── eslint.config.mjs
│   ├── hooks
│   │   ├── use-filetree-socket.ts
│   │   ├── use-mobile.ts
│   │   └── use-online-members.ts
│   ├── lib
│   │   └── utils.ts
│   ├── next.config.ts
│   ├── next-env.d.ts
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── pnpm-workspace.yaml
│   ├── postcss.config.mjs
│   ├── public
│   │   ├── dokit.svg
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── offline.html
│   │   ├── service-worker.js
│   │   └── window.svg
│   ├── README.md
│   ├── store
│   │   ├── account.ts
│   │   ├── authentication.ts
│   │   ├── chat.ts
│   │   ├── editor.ts
│   │   ├── project.ts
│   │   └── store.ts
│   ├── tsconfig.json
│   ├── types
│   │   └── types.ts
│   └── utils
│       ├── allowedTools.ts
│       ├── apiHandler.ts
│       ├── api.ts
│       ├── defaultPorts.ts
│       └── getLanguageExtension.ts
├── docs
│   ├── diagrams
│   │   ├── dokit_database_schema.png
│   │   ├── dokit_realtime_sync_flow.png
│   │   └── dokit_system_architecture.png
│   ├── DIRECTORY_STRUCTURE.md
│   ├── Dokit.png
│   └── SETUP.md
├── eslint.config.ts
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── README.md
├── server
│   ├── docker
│   │   ├── blank
│   │   │   ├── Dockerfile
│   │   │   └── entrypoint.sh
│   │   ├── express
│   │   │   ├── Dockerfile
│   │   │   └── entrypoint.sh
│   │   ├── github
│   │   │   ├── Dockerfile
│   │   │   └── entrypoint.sh
│   │   ├── nginx
│   │   │   ├── Dockerfile
│   │   │   └── nginx.conf.template
│   │   ├── node
│   │   │   ├── Dockerfile
│   │   │   └── entrypoint.sh
│   │   └── react_vite
│   │       ├── Dockerfile
│   │       └── entrypoint.sh
│   ├── docker-compose.yaml
│   ├── geoip
│   │   └── GeoLite2-City.mmdb
│   ├── logs
│   │   ├── app-dev.log
│   │   ├── app-prod.log
│   │   ├── error-dev.log
│   │   └── error-prod.log
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── prisma
│   │   ├── migrations
│   │   │   ├── 20260130083724_first
│   │   │   │   └── migration.sql
│   │   │   ├── 20260201080605_add_username_to_user
│   │   │   │   └── migration.sql
│   │   │   ├── 20260201191333_col_name_changed
│   │   │   │   └── migration.sql
│   │   │   ├── 20260201192902_change_session_cols_to_json
│   │   │   │   └── migration.sql
│   │   │   ├── 20260217135904_add_project_table
│   │   │   │   └── migration.sql
│   │   │   ├── 20260217153522_r2prefix_column_deleted
│   │   │   │   └── migration.sql
│   │   │   ├── 20260225092923_add_password_field_in_project
│   │   │   │   └── migration.sql
│   │   │   ├── 20260228130956_add_visibility_column
│   │   │   │   └── migration.sql
│   │   │   ├── 20260310073632_add_columns_and_relations_for_access_control
│   │   │   │   └── migration.sql
│   │   │   ├── 20260310075008_share_access_column_added_in_project_table
│   │   │   │   └── migration.sql
│   │   │   ├── 20260310082319_drop_share_acess_column_in_project_table
│   │   │   │   └── migration.sql
│   │   │   ├── 20260331171751_pinned_and_2fa_columns_added
│   │   │   │   └── migration.sql
│   │   │   ├── 20260403120134_two_factor_secret_and_backup_codes_columns_added
│   │   │   │   └── migration.sql
│   │   │   ├── 20260404095827_session_table_modified
│   │   │   │   └── migration.sql
│   │   │   ├── 20260409123650_add_tools_column_in_project_table
│   │   │   │   └── migration.sql
│   │   │   ├── 20260410183749_add_github_in_projectstacks
│   │   │   │   └── migration.sql
│   │   │   ├── 20260414170818_add_blank_in_project_stack
│   │   │   │   └── migration.sql
│   │   │   ├── 20260414173015_remove_github_from_project_stack
│   │   │   │   └── migration.sql
│   │   │   ├── 20260531130305_add_codechunk_table
│   │   │   │   └── migration.sql
│   │   │   ├── 20260531173055_add_tables_for_ai_chat
│   │   │   │   └── migration.sql
│   │   │   ├── 20260607083849_add_summary_column_in_chatthread_table
│   │   │   │   └── migration.sql
│   │   │   └── migration_lock.toml
│   │   └── schema.prisma
│   ├── prisma.config.ts
│   ├── scripts
│   │   ├── make_images.sh
│   │   ├── update.sh
│   │   └── uploadBaseTemplates.ts
│   ├── src
│   │   ├── config
│   │   │   ├── bloomFilter.ts
│   │   │   ├── checkEnv.ts
│   │   │   ├── env.ts
│   │   │   ├── mailer.ts
│   │   │   ├── r2.ts
│   │   │   ├── redisClient.ts
│   │   │   └── redisQueue.ts
│   │   ├── constants
│   │   │   └── tools.ts
│   │   ├── db
│   │   │   └── prisma.ts
│   │   ├── generated
│   │   │   └── prisma
│   │   │       ├── client.d.ts
│   │   │       ├── client.js
│   │   │       ├── default.d.ts
│   │   │       ├── default.js
│   │   │       ├── edge.d.ts
│   │   │       ├── edge.js
│   │   │       ├── index-browser.js
│   │   │       ├── index.d.ts
│   │   │       ├── index.js
│   │   │       ├── libquery_engine-debian-openssl-3.0.x.so.node
│   │   │       ├── package.json
│   │   │       ├── query_engine_bg.js
│   │   │       ├── query_engine_bg.wasm
│   │   │       ├── runtime
│   │   │       │   ├── edge-esm.js
│   │   │       │   ├── edge.js
│   │   │       │   ├── index-browser.d.ts
│   │   │       │   ├── index-browser.js
│   │   │       │   ├── library.d.ts
│   │   │       │   ├── library.js
│   │   │       │   ├── react-native.js
│   │   │       │   ├── wasm-compiler-edge.js
│   │   │       │   └── wasm-engine-edge.js
│   │   │       ├── schema.prisma
│   │   │       ├── wasm.d.ts
│   │   │       ├── wasm-edge-light-loader.mjs
│   │   │       ├── wasm.js
│   │   │       └── wasm-worker-loader.mjs
│   │   ├── index.ts
│   │   ├── jobs
│   │   │   └── scheduler.ts
│   │   ├── middlewares
│   │   │   ├── authenticate.ts
│   │   │   ├── globalErrorHandler.ts
│   │   │   ├── httpLogger.ts
│   │   │   ├── IP.ts
│   │   │   ├── location.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── UAparser.ts
│   │   │   └── validation.ts
│   │   ├── modules
│   │   │   ├── account
│   │   │   │   ├── controllers.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── validators.ts
│   │   │   ├── auth
│   │   │   │   ├── controllers.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── validators.ts
│   │   │   ├── chat
│   │   │   │   ├── controllers.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── validators.ts
│   │   │   ├── editor
│   │   │   │   ├── controllers.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── validators.ts
│   │   │   ├── project
│   │   │   │   ├── access.controller.ts
│   │   │   │   ├── access.routes.ts
│   │   │   │   ├── controllers.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── validators.ts
│   │   │   └── queue
│   │   │       ├── queueActions.ts
│   │   │       ├── queueNames.ts
│   │   │       ├── queues.ts
│   │   │       ├── workerActions.ts
│   │   │       └── workers.ts
│   │   ├── services
│   │   │   ├── dockerManager.ts
│   │   │   ├── r2Manager.ts
│   │   │   └── rag
│   │   │       ├── astParser.ts
│   │   │       ├── embeddingService.ts
│   │   │       ├── ingestionService.ts
│   │   │       └── retrievalService.ts
│   │   ├── sockets
│   │   │   ├── projectSocket.ts
│   │   │   └── yjsServer.ts
│   │   ├── types
│   │   │   ├── archiver.d.ts
│   │   │   └── express.d.ts
│   │   └── utils
│   │       ├── auth-utils.ts
│   │       ├── emailTemplates.ts
│   │       ├── logger.ts
│   │       └── sendResponse.ts
│   ├── templates
│   │   ├── express
│   │   │   ├── index.js
│   │   │   └── package.json
│   │   ├── go
│   │   ├── node
│   │   │   ├── main.js
│   │   │   └── package.json
│   │   └── react_vite
│   │       ├── eslint.config.js
│   │       ├── index.html
│   │       ├── package.json
│   │       ├── public
│   │       │   └── vite.svg
│   │       ├── README.md
│   │       ├── src
│   │       │   ├── App.css
│   │       │   ├── App.jsx
│   │       │   ├── assets
│   │       │   │   └── react.svg
│   │       │   ├── index.css
│   │       │   └── main.jsx
│   │       └── vite.config.js
│   └── tsconfig.json
└── skills-lock.json
```