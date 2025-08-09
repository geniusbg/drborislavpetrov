"use strict";(()=>{var e={};e.id=2628,e.ids=[2628],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8678:e=>{e.exports=import("pg")},38013:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{originalPathname:()=>p,patchFetch:()=>u,requestAsyncStorage:()=>d,routeModule:()=>T,serverHooks:()=>c,staticGenerationAsyncStorage:()=>l});var n=r(49303),s=r(88716),a=r(60670),i=r(6694),E=e([i]);i=(E.then?(await E)():E)[0];let T=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/admin/users/route",pathname:"/api/admin/users",filename:"route",bundlePath:"app/api/admin/users/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\admin\\users\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:d,staticGenerationAsyncStorage:l,serverHooks:c}=T,p="/api/admin/users/route";function u(){return(0,a.patchFetch)({serverHooks:c,staticGenerationAsyncStorage:l})}o()}catch(e){o(e)}})},6694:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{DELETE:()=>d,GET:()=>E,POST:()=>u,PUT:()=>T});var n=r(87070),s=r(38990),a=r(64284),i=e([s]);async function E(e){try{let t=e.headers.get("x-admin-token");if(console.log("\uD83D\uDD0D Users API - adminToken:",t?"present":"missing"),!t||"test"!==t&&"mock-token"!==t)return console.log("❌ Users API - Unauthorized: invalid token"),n.NextResponse.json({error:"Unauthorized"},{status:401});console.log("\uD83D\uDD0D Users API - Connecting to database...");let r=await (0,s.N8)();console.log("\uD83D\uDD0D Users API - Database connected, executing query...");let o=await r.query("SELECT id, name, email, phone, address, notes, createdat, updatedat FROM users ORDER BY name");return console.log("\uD83D\uDD0D Users API - Query executed, rows:",o.rows.length),r.release(),n.NextResponse.json({users:o.rows})}catch(e){return console.error("❌ Error fetching users:",e),n.NextResponse.json({error:"Internal server error"},{status:500})}}async function u(e){try{let t=e.headers.get("x-admin-token");if(!t||"test"!==t&&"mock-token"!==t)return n.NextResponse.json({error:"Unauthorized"},{status:401});let{name:r,email:o,phone:i,address:E,notes:u}=await e.json();if(!r)return n.NextResponse.json({error:"Name is required"},{status:400});let T=await (0,s.N8)();if(i&&i.trim()){let e=i.replace(/\D/g,"").slice(-9);if((await T.query("SELECT * FROM users WHERE right(regexp_replace(coalesce(phone, ''), \n		'[^0-9]', '', 'g'), 9) = $1",[e])).rows.length>0)return T.release(),n.NextResponse.json({error:"User with this phone number already exists"},{status:409})}let d=(await T.query(`
      INSERT INTO users (name, email, phone, address, notes, createdat)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `,[r,o||null,i&&i.trim()?i.trim():null,E||null,u||null])).rows[0];return T.release(),(0,a._X)(d),n.NextResponse.json({message:"User created successfully",userId:d.id})}catch(e){return console.error("Error creating user:",e),n.NextResponse.json({error:"Internal server error"},{status:500})}}async function T(e){try{let t=e.headers.get("x-admin-token");if(!t||"test"!==t&&"mock-token"!==t)return n.NextResponse.json({error:"Unauthorized"},{status:401});let{id:r,name:o,email:i,phone:E,address:u,notes:T}=await e.json();if(!r||!o)return n.NextResponse.json({error:"ID and name are required"},{status:400});let d=await (0,s.N8)();if(E&&E.trim()){let e=E.replace(/\D/g,"").slice(-9);if((await d.query("SELECT * FROM users WHERE right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 9) = $1 AND id != $2",[e,r])).rows.length>0)return d.release(),n.NextResponse.json({error:"Phone number is already used by another user"},{status:409})}let l=(await d.query(`
      UPDATE users 
      SET name = $1, email = $2, phone = $3, address = $4, notes = $5, updatedat = NOW()
      WHERE id = $6
      RETURNING *
    `,[o,i||null,E&&E.trim()?E.trim():null,u||null,T||null,r])).rows[0];return d.release(),(0,a.hq)(l),n.NextResponse.json({message:"User updated successfully"})}catch(e){return console.error("Error updating user:",e),n.NextResponse.json({error:"Internal server error"},{status:500})}}async function d(e){try{let t=e.headers.get("x-admin-token");if(!t||"test"!==t&&"mock-token"!==t)return n.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:r}=new URL(e.url),o=r.get("id");if(!o)return n.NextResponse.json({error:"User ID is required"},{status:400});let i=await (0,s.N8)(),E=await i.query("SELECT COUNT(*) as count FROM bookings WHERE phone = (SELECT phone FROM users WHERE id = $1)",[o]);if(parseInt(E.rows[0].count)>0)return i.release(),n.NextResponse.json({error:"Не може да се изтрие потребител със съществуващи резервации"},{status:400});return await i.query("DELETE FROM users WHERE id = $1",[o]),i.release(),(0,a.Cj)(o),n.NextResponse.json({message:"User deleted successfully"})}catch(e){return console.error("Error deleting user:",e),n.NextResponse.json({error:"Internal server error"},{status:500})}}s=(i.then?(await i)():i)[0],o()}catch(e){o(e)}})},38990:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.d(t,{N8:()=>a,n2:()=>u,vs:()=>E});var n=r(8678),s=e([n]);n=(s.then?(await s)():s)[0];let T=null;async function a(){T||((T=new n.Pool({host:process.env.DB_HOST||"192.168.1.134",port:parseInt(process.env.DB_PORT||"5432"),database:process.env.DB_NAME||"drborislavpetrov",user:process.env.DB_USER||"drborislavpetrov",password:process.env.DB_PASSWORD||"Xander123)(*",max:30,min:2,idleTimeoutMillis:6e4,connectionTimeoutMillis:3e4})).on("error",e=>{console.error("❌ Unexpected error on idle client",e)}),T.on("connect",()=>{console.log("✅ New database connection established")}));try{let e=await T.connect();return await i(e),e}catch(e){if(console.error("❌ Error connecting to database:",e),T)return console.log("\uD83D\uDD04 Attempting to recreate pool..."),await T.end(),T=null,await new Promise(e=>setTimeout(e,1e3)),a();throw e}}async function i(e){try{await e.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        service TEXT NOT NULL,
        serviceduration INTEGER DEFAULT 30,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        treatment_notes TEXT,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `),await e.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT UNIQUE NULL,
        address TEXT,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);try{await e.query(`
        ALTER TABLE users 
        ALTER COLUMN phone DROP NOT NULL
      `)}catch(e){console.log("Phone column already allows NULL or constraint not found")}await e.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `),await e.query(`
      CREATE TABLE IF NOT EXISTS working_hours (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        is_working_day BOOLEAN DEFAULT true,
        start_time TEXT DEFAULT '09:00',
        end_time TEXT DEFAULT '18:00',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `),await e.query(`
      CREATE TABLE IF NOT EXISTS working_breaks (
        id SERIAL PRIMARY KEY,
        working_hours_id INTEGER REFERENCES working_hours(id) ON DELETE CASCADE,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        description TEXT DEFAULT 'Почивка',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `),await e.query(`
      CREATE TABLE IF NOT EXISTS bug_reports (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
        category TEXT CHECK (category IN ('ui', 'functionality', 'performance', 'security', 'database')),
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        reporter TEXT NOT NULL,
        assigned_to TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        steps_to_reproduce TEXT[],
        expected_behavior TEXT,
        actual_behavior TEXT,
        browser TEXT,
        device TEXT,
        screenshots TEXT[],
        tags TEXT[]
      )
    `),await e.query(`
      CREATE TABLE IF NOT EXISTS bug_comments (
        id SERIAL PRIMARY KEY,
        bug_id INTEGER REFERENCES bug_reports(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_internal BOOLEAN DEFAULT false
      )
    `),await e.query(`
      CREATE TABLE IF NOT EXISTS bug_attachments (
        id SERIAL PRIMARY KEY,
        bug_id INTEGER REFERENCES bug_reports(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);let t=await e.query("SELECT COUNT(*) as count FROM services");0===parseInt(t.rows[0].count)&&await e.query(`
        INSERT INTO services (name, description, duration, price) VALUES
        ('Преглед и консултация', 'Основен преглед на зъбите и консултация', 30, 50.00),
        ('Почистване и профилактика', 'Професионално почистване на зъбен камък', 45, 80.00),
        ('Лечение на кариес', 'Лечение на кариес с модерни материали', 60, 120.00),
        ('Отбелязване', 'Професионално отбелязване на зъбите', 90, 200.00),
        ('Ортодонтия', 'Консултация за ортодонтски лечение', 45, 100.00)
      `)}catch(e){throw console.error("Error creating tables:",e),e}}function E(){return T?{totalCount:T.totalCount,idleCount:T.idleCount,waitingCount:T.waitingCount}:null}function u(e,t){console.error(`❌ Database error in ${t}:`,{message:e?.message,code:e?.code,detail:e?.detail,hint:e?.hint,where:e?.where,stack:e?.stack})}o()}catch(e){o(e)}})},64284:(e,t,r)=>{function o(){return globalThis.io?globalThis.io:(console.warn("⚠️ Socket.io not initialized yet"),null)}function n(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting booking-updated event:",e),t.to("admin").emit("booking-updated",e)):console.warn("⚠️ Socket.io not available for booking-updated event")}function s(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting booking-added event:",e),t.to("admin").emit("booking-added",e)):console.warn("⚠️ Socket.io not available for booking-added event")}function a(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting booking-deleted event:",e),t.to("admin").emit("booking-deleted",e)):console.warn("⚠️ Socket.io not available for booking-deleted event")}function i(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting user-added event:",e),t.to("admin").emit("user-added",e)):console.warn("⚠️ Socket.io not available for user-added event")}function E(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting user-updated event:",e),t.to("admin").emit("user-updated",e)):console.warn("⚠️ Socket.io not available for user-updated event")}function u(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting user-deleted event:",e),t.to("admin").emit("user-deleted",e)):console.warn("⚠️ Socket.io not available for user-deleted event")}function T(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting service-added event:",e),t.to("admin").emit("service-added",e)):console.warn("⚠️ Socket.io not available for service-added event")}function d(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting service-updated event:",e),t.to("admin").emit("service-updated",e)):console.warn("⚠️ Socket.io not available for service-updated event")}function l(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting service-deleted event:",e),t.to("admin").emit("service-deleted",e)):console.warn("⚠️ Socket.io not available for service-deleted event")}r.d(t,{Cj:()=>u,_$:()=>l,_X:()=>i,bd:()=>a,hF:()=>d,hq:()=>E,iN:()=>T,kk:()=>s,rp:()=>n})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972],()=>r(38013));module.exports=o})();