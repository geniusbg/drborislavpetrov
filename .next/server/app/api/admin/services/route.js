"use strict";(()=>{var e={};e.id=1487,e.ids=[1487],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8678:e=>{e.exports=import("pg")},11503:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{originalPathname:()=>N,patchFetch:()=>E,requestAsyncStorage:()=>d,routeModule:()=>c,serverHooks:()=>l,staticGenerationAsyncStorage:()=>u});var n=r(49303),i=r(88716),a=r(60670),s=r(38313),T=e([s]);s=(T.then?(await T)():T)[0];let c=new n.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/admin/services/route",pathname:"/api/admin/services",filename:"route",bundlePath:"app/api/admin/services/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\admin\\services\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:u,serverHooks:l}=c,N="/api/admin/services/route";function E(){return(0,a.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:u})}o()}catch(e){o(e)}})},38313:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{DELETE:()=>d,GET:()=>T,POST:()=>E,PUT:()=>c});var n=r(87070),i=r(38990),a=r(64284),s=e([i]);async function T(e){try{let t=e.headers.get("x-admin-token");if(!t||"test"!==t&&"mock-token"!==t)return n.NextResponse.json({error:"Unauthorized"},{status:401});let r=await (0,i.N8)(),o=await r.query("SELECT * FROM services ORDER BY name");return r.release(),n.NextResponse.json({services:o.rows})}catch(e){return n.NextResponse.json({error:"Internal server error"},{status:500})}}async function E(e){try{let t=e.headers.get("x-admin-token");if(!t||"test"!==t&&"mock-token"!==t)return n.NextResponse.json({error:"Unauthorized"},{status:401});let{name:r,description:o,duration:s,price:T,isActive:E}=await e.json(),c=await (0,i.N8)(),d=(await c.query(`
      INSERT INTO services (name, description, duration, price, isActive)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,[r,o,s,T,E??!0])).rows[0];return c.release(),(0,a.iN)(d),n.NextResponse.json({success:!0,service:d})}catch(e){return n.NextResponse.json({error:"Internal server error"},{status:500})}}async function c(e){try{let t=e.headers.get("x-admin-token");if(!t||"test"!==t&&"mock-token"!==t)return n.NextResponse.json({error:"Unauthorized"},{status:401});let{id:r,name:o,description:s,duration:T,price:E,isActive:c}=await e.json(),d=await (0,i.N8)(),u=await d.query(`
      UPDATE services 
      SET name = $1, description = $2, duration = $3, price = $4, isActive = $5
      WHERE id = $6
      RETURNING *
    `,[o,s,T,E,c,r]);if(0===u.rowCount)return d.release(),n.NextResponse.json({error:"Service not found"},{status:404});let l=u.rows[0];return d.release(),(0,a.hF)(l),n.NextResponse.json({success:!0,service:l})}catch(e){return n.NextResponse.json({error:"Internal server error"},{status:500})}}async function d(e){try{let t=e.headers.get("x-admin-token");if(!t||"test"!==t&&"mock-token"!==t)return n.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:r}=new URL(e.url),o=r.get("id");if(!o)return n.NextResponse.json({error:"Service ID required"},{status:400});let s=await (0,i.N8)(),T=await s.query("DELETE FROM services WHERE id = $1",[o]);if(0===T.rowCount)return s.release(),n.NextResponse.json({error:"Service not found"},{status:404});return s.release(),(0,a._$)(o),n.NextResponse.json({success:!0})}catch(e){return n.NextResponse.json({error:"Internal server error"},{status:500})}}i=(s.then?(await s)():s)[0],o()}catch(e){o(e)}})},38990:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.d(t,{N8:()=>a,n2:()=>E,vs:()=>T});var n=r(8678),i=e([n]);n=(i.then?(await i)():i)[0];let c=null;async function a(){c||((c=new n.Pool({host:process.env.DB_HOST||"192.168.1.134",port:parseInt(process.env.DB_PORT||"5432"),database:process.env.DB_NAME||"drborislavpetrov",user:process.env.DB_USER||"drborislavpetrov",password:process.env.DB_PASSWORD||"Xander123)(*",max:30,min:2,idleTimeoutMillis:6e4,connectionTimeoutMillis:3e4})).on("error",e=>{console.error("❌ Unexpected error on idle client",e)}),c.on("connect",()=>{console.log("✅ New database connection established")}));try{let e=await c.connect();return await s(e),e}catch(e){if(console.error("❌ Error connecting to database:",e),c)return console.log("\uD83D\uDD04 Attempting to recreate pool..."),await c.end(),c=null,await new Promise(e=>setTimeout(e,1e3)),a();throw e}}async function s(e){try{await e.query(`
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
      `)}catch(e){throw console.error("Error creating tables:",e),e}}function T(){return c?{totalCount:c.totalCount,idleCount:c.idleCount,waitingCount:c.waitingCount}:null}function E(e,t){console.error(`❌ Database error in ${t}:`,{message:e?.message,code:e?.code,detail:e?.detail,hint:e?.hint,where:e?.where,stack:e?.stack})}o()}catch(e){o(e)}})},64284:(e,t,r)=>{function o(){return globalThis.io?globalThis.io:(console.warn("⚠️ Socket.io not initialized yet"),null)}function n(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting booking-updated event:",e),t.to("admin").emit("booking-updated",e)):console.warn("⚠️ Socket.io not available for booking-updated event")}function i(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting booking-added event:",e),t.to("admin").emit("booking-added",e)):console.warn("⚠️ Socket.io not available for booking-added event")}function a(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting booking-deleted event:",e),t.to("admin").emit("booking-deleted",e)):console.warn("⚠️ Socket.io not available for booking-deleted event")}function s(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting user-added event:",e),t.to("admin").emit("user-added",e)):console.warn("⚠️ Socket.io not available for user-added event")}function T(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting user-updated event:",e),t.to("admin").emit("user-updated",e)):console.warn("⚠️ Socket.io not available for user-updated event")}function E(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting user-deleted event:",e),t.to("admin").emit("user-deleted",e)):console.warn("⚠️ Socket.io not available for user-deleted event")}function c(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting service-added event:",e),t.to("admin").emit("service-added",e)):console.warn("⚠️ Socket.io not available for service-added event")}function d(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting service-updated event:",e),t.to("admin").emit("service-updated",e)):console.warn("⚠️ Socket.io not available for service-updated event")}function u(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting service-deleted event:",e),t.to("admin").emit("service-deleted",e)):console.warn("⚠️ Socket.io not available for service-deleted event")}r.d(t,{Cj:()=>E,_$:()=>u,_X:()=>s,bd:()=>a,hF:()=>d,hq:()=>T,iN:()=>c,kk:()=>i,rp:()=>n})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972],()=>r(11503));module.exports=o})();