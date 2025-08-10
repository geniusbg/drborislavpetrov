"use strict";(()=>{var e={};e.id=9602,e.ids=[9602],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8678:e=>{e.exports=import("pg")},49639:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{originalPathname:()=>N,patchFetch:()=>l,requestAsyncStorage:()=>d,routeModule:()=>E,serverHooks:()=>T,staticGenerationAsyncStorage:()=>c});var i=r(49303),n=r(88716),a=r(60670),s=r(16442),u=e([s]);s=(u.then?(await u)():u)[0];let E=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/bookings/route",pathname:"/api/admin/bookings",filename:"route",bundlePath:"app/api/admin/bookings/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\admin\\bookings\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:c,serverHooks:T}=E,N="/api/admin/bookings/route";function l(){return(0,a.patchFetch)({serverHooks:T,staticGenerationAsyncStorage:c})}o()}catch(e){o(e)}})},16442:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{DELETE:()=>T,GET:()=>E,POST:()=>d,PUT:()=>c});var i=r(87070),n=r(38990),a=r(64284),s=e([n]);n=(s.then?(await s)():s)[0];let N=0,m=null;async function u(e){if(null!==m)return m;try{return m=(await e.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'user_id' LIMIT 1")).rows.length>0}catch{return m=!1,!1}}async function l(e,t,r,o,i,n){try{let a=await e.query("SELECT duration FROM services WHERE id = $1",[o]);if(0===a.rowCount)return{available:!1,error:"Service not found"};let s=i||a.rows[0].duration||30,[u,l]=r.split(":").map(Number),E=60*u+l,d=E+s;for(let r of(await e.query(`
      SELECT wb.start_time, wb.end_time
      FROM working_hours wh
      JOIN working_breaks wb ON wh.id = wb.working_hours_id
      WHERE wh.date = $1
    `,[t])).rows){let[e,t]=r.start_time.split(":").map(Number),[o,i]=r.end_time.split(":").map(Number),n=60*e+t,a=60*o+i;if(E>=n&&E<a||d>n&&d<=a||E<=n&&d>=a)return{available:!1,error:`Time slot conflicts with break time (${r.start_time} - ${r.end_time})`}}let c=`
      SELECT b.time, b.serviceduration, b.id
      FROM bookings b
      WHERE b.date = $1 
        AND b.status != 'cancelled'
        ${n?"AND b.id != $2":""}
    `,T=n?[t,n]:[t];for(let t of(await e.query(c,T)).rows){let[e,r]=t.time.split(":").map(Number),o=60*e+r,i=t.serviceduration||30,n=o+i;if(E>=o&&E<n||d>o&&d<=n||E<=o&&d>=n)return{available:!1,error:`Time slot conflicts with existing booking at ${t.time}`}}return{available:!0}}catch(e){return console.error("Error checking time slot availability:",e),{available:!1,error:"Error checking availability"}}}async function E(e){N++,console.log(`🌐 API /admin/bookings GET call #${N}`);try{let t=e.headers.get("x-admin-token"),{searchParams:r}=new URL(e.url),o=r.get("date"),a=r.get("id");if(console.log("\uD83C\uDF10 API /admin/bookings GET called:",{callNumber:N,hasDate:!!o,hasId:!!a,date:o,id:a,adminToken:t?"present":"missing",userAgent:e.headers.get("user-agent")?.substring(0,50),timestamp:new Date().toISOString()}),!t||"test"!==t&&"mock-token"!==t)return console.log("❌ Unauthorized: invalid admin token"),i.NextResponse.json({error:"Unauthorized"},{status:401});if(o){let e=null;try{e=await (0,n.N8)();let t=await e.query(`
          SELECT b.id, b.time, 
                 COALESCE(b.serviceduration, 30) as serviceDuration
          FROM bookings b
          WHERE b.date = $1 AND b.status != 'cancelled'
          ORDER BY b.time
        `,[o]),r=await e.query(`
          SELECT wh.start_time, wh.end_time,
                 COALESCE(
                   json_agg(
                     json_build_object(
                       'id', wb.id,
                       'startTime', wb.start_time,
                       'endTime', wb.end_time,
                       'description', wb.description
                     )
                   ) FILTER (WHERE wb.id IS NOT NULL), 
                   '[]'::json
                 ) as breaks
          FROM working_hours wh
          LEFT JOIN working_breaks wb ON wh.id = wb.working_hours_id
          WHERE wh.date = $1
          GROUP BY wh.id, wh.start_time, wh.end_time
        `,[o]),a=t.rows.map(e=>{let{serviceduration:t,...r}=e;return{...r,serviceDuration:t||e.serviceDuration||30}}),s=r.rows[0]||null;return i.NextResponse.json({date:o,bookedSlots:a,workingHours:s,message:"Available time slots retrieved successfully"})}catch(e){return console.error("Error fetching available time slots:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}finally{e&&e.release()}}let s=null;try{s=await (0,n.N8)();let e=await u(s),t=(await s.query(e?`
        SELECT b.*, 
               COALESCE(s.name, b.service::text) as serviceName, 
               COALESCE(b.serviceduration, s.duration, 30) as serviceDuration,
               u.id as userId,
               u.name as userName, 
               u.email as userEmail
        FROM bookings b
        LEFT JOIN services s ON (
          b.service::text = s.id::text OR b.service = s.name
        )
        LEFT JOIN users u ON (
          b.user_id = u.id
          OR (b.user_id IS NULL AND b.phone IS NOT NULL AND u.phone IS NOT NULL AND right(regexp_replace(b.phone, '[^0-9]', '', 'g'), 9) = right(regexp_replace(u.phone, '[^0-9]', '', 'g'), 9))
          OR (b.user_id IS NULL AND b.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(b.email) = LOWER(u.email))
          OR (
            b.user_id IS NULL 
            AND (b.phone IS NULL OR b.phone = '') AND (u.phone IS NULL OR u.phone = '') 
            AND (b.email IS NULL OR b.email = '') AND (u.email IS NULL OR u.email = '') 
            AND LOWER(regexp_replace(trim(b.name), '\\s+', ' ', 'g')) = LOWER(regexp_replace(trim(u.name), '\\s+', ' ', 'g'))
          )
        )
        ORDER BY b.createdat DESC
      `:`
        SELECT b.*, 
               COALESCE(s.name, b.service::text) as serviceName, 
               COALESCE(b.serviceduration, s.duration, 30) as serviceDuration,
               u.id as userId,
               u.name as userName, 
               u.email as userEmail
        FROM bookings b
        LEFT JOIN services s ON (
          b.service::text = s.id::text OR b.service = s.name
        )
        LEFT JOIN users u ON (
          (b.phone IS NOT NULL AND u.phone IS NOT NULL AND right(regexp_replace(b.phone, '[^0-9]', '', 'g'), 9) = right(regexp_replace(u.phone, '[^0-9]', '', 'g'), 9))
          OR (b.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(b.email) = LOWER(u.email))
          OR ((b.phone IS NULL OR b.phone = '') AND (u.phone IS NULL OR u.phone = '') AND (b.email IS NULL OR b.email = '') AND (u.email IS NULL OR u.email = '') AND LOWER(b.name) = LOWER(u.name))
        )
        ORDER BY b.createdat DESC
      `)).rows.map(e=>{let{serviceduration:t,createdat:r,...o}=e;return{...o,createdAt:r||e.createdAt,serviceDuration:t||e.serviceDuration||30}}),r=new Map;for(let e of t){let t=e&&e.id?String(e.id):JSON.stringify(e);r.has(t)||r.set(t,e)}let o=Array.from(r.values());return i.NextResponse.json({bookings:o})}catch(e){return console.error("Error fetching bookings:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}finally{s&&s.release()}}catch(e){return console.error("Error fetching bookings:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}async function d(e){try{if(!e.headers.get("x-admin-token"))return i.NextResponse.json({error:"Unauthorized"},{status:401});let{name:t,email:r,phone:o,service:s,serviceDuration:E,date:d,time:c,message:T}=await e.json();if(!t||!s||!d||!c)return i.NextResponse.json({error:"Missing required fields: name, service, date, time"},{status:400});if(!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(c))return i.NextResponse.json({error:"Invalid time format. Please use HH:MM format (e.g., 14:30)"},{status:400});if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return i.NextResponse.json({error:"Invalid date format. Please use YYYY-MM-DD format"},{status:400});let N=await (0,n.N8)();if(o&&o.trim()){let e=await N.query("SELECT * FROM users WHERE phone = $1",[o.trim()]);if(0===e.rows.length)await N.query(`
          INSERT INTO users (name, email, phone)
          VALUES ($1, $2, $3)
          RETURNING id
        `,[t,r||null,o.trim()]),console.log(`✅ Created new user for phone: ${o.trim()}`);else{let i=e.rows[0];(i.name!==t||i.email!==r)&&(await N.query(`
            UPDATE users 
            SET name = $1, email = $2, updatedAt = CURRENT_TIMESTAMP
            WHERE id = $3
          `,[t,r||null,i.id]),console.log(`✅ Updated existing user for phone: ${o.trim()}`))}}let m=await l(N,d,c,parseInt(s),E);if(!m.available)return N.release(),i.NextResponse.json({error:m.error},{status:409});let g=null;try{let e=await N.query(`
        SELECT id FROM users 
        WHERE (
          ($1 IS NOT NULL AND $1 <> '' AND phone IS NOT NULL AND right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) = right(regexp_replace($1, '[^0-9]', '', 'g'), 9))
        ) OR (
          ($2 IS NOT NULL AND $2 <> '' AND email IS NOT NULL AND LOWER(email) = LOWER($2))
        ) OR (
          ($1 IS NULL OR $1 = '') AND ($2 IS NULL OR $2 = '') AND LOWER(name) = LOWER($3)
        )
        LIMIT 1
      `,[o||null,r||null,t]);e.rows[0]&&(g=e.rows[0].id)}catch(e){console.warn("User lookup failed, proceeding without user_id")}let L=await u(N),R=await N.query(L?`
      INSERT INTO bookings (name, email, phone, service, serviceduration, date, time, message, status, createdat, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10)
      RETURNING id, createdat
    `:`
      INSERT INTO bookings (name, email, phone, service, serviceduration, date, time, message, status, createdat)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING id, createdat
    `,L?[t,r||null,o||null,parseInt(s),E||30,d,c,T||null,"pending",g]:[t,r||null,o||null,parseInt(s),E||30,d,c,T||null,"pending"]),p=R.rows[0].id,b=R.rows[0].createdat,A={id:p,name:t,email:r,phone:o,userId:L&&g||void 0,service:s,serviceDuration:E||30,date:d,time:c,message:T,status:"pending",createdAt:b};N.release();try{let e=await N.query("SELECT name FROM services WHERE id::text = $1 OR name = $1",[String(s)]),t={...A,serviceName:e.rows[0]?.name||String(s)};(0,a.kk)(t)}catch(e){console.error("WebSocket emit error:",e)}return i.NextResponse.json({message:"Booking created successfully",id:p})}catch(e){return console.error("Error creating booking:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}async function c(e){try{if(!e.headers.get("x-admin-token"))return i.NextResponse.json({error:"Unauthorized"},{status:401});let t=await e.json();console.log("\uD83D\uDD0D [PUT Bookings] Request body:",t);let{id:r,status:o,treatment_notes:s,...u}=t;if(console.log("\uD83D\uDD0D [PUT Bookings] Extracted data:",{id:r,status:o,treatment_notes:s,otherFields:u}),!r)return i.NextResponse.json({error:"Booking ID is required"},{status:400});let E=await (0,n.N8)(),d=void 0!==o&&0===Object.keys(u).length,c=void 0!==s&&0===Object.keys(u).length;if(d)await E.query("UPDATE bookings SET status = $1 WHERE id = $2",[o,r]);else if(c)await E.query("UPDATE bookings SET treatment_notes = $1 WHERE id = $2",[s,r]);else{let{name:e,email:t,phone:n,service:a,serviceDuration:s,date:d,time:c,message:T}=u;if(console.log("\uD83D\uDD0D [PUT Bookings] Update booking details:",{name:e,email:t,phone:n,service:a,serviceDuration:s,date:d,time:c,message:T}),d&&c&&a){let e=await l(E,d,c,parseInt(a),s,parseInt(r));if(!e.available)return E.release(),i.NextResponse.json({error:e.error},{status:409})}console.log("\uD83D\uDD0D [PUT Bookings] SQL Update params:",[e,t||null,n,a,s||30,d,c,T||null,o||"pending",r]);let N=await E.query(`
        UPDATE bookings
        SET name = $1, email = $2, phone = $3, service = $4, serviceduration = $5, date = $6, time = $7, message = $8, status = $9
        WHERE id = $10
      `,[e,t||null,n,a,s||30,d,c,T||null,o||"pending",r]);console.log("\uD83D\uDD0D [PUT Bookings] SQL Update result:",N.rowCount)}E.release();let T=await E.query(`
      SELECT b.*, 
             COALESCE(s.name, b.service::text) as serviceName,
             COALESCE(b.serviceduration, s.duration, 30) as serviceDuration,
             u.name as userName, 
             u.email as userEmail
      FROM bookings b
      LEFT JOIN services s ON (
        b.service::text = s.id::text OR b.service = s.name
      )
      LEFT JOIN users u ON b.phone = u.phone
      WHERE b.id = $1
    `,[r]),N=(()=>{let e=T.rows[0];if(!e)return null;let{serviceduration:t,createdat:r,...o}=e;return{...o,createdAt:r||e.createdAt,serviceDuration:t||e.serviceDuration||30}})();try{N&&(0,a.rp)(N)}catch(e){console.error("WebSocket emit error:",e)}return i.NextResponse.json({message:"Booking updated successfully",booking:N})}catch(e){return console.error("Error updating booking:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}async function T(e){try{if(!e.headers.get("x-admin-token"))return i.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:t}=new URL(e.url),r=t.get("id");if(!r)return i.NextResponse.json({error:"Booking ID is required"},{status:400});let o=await (0,n.N8)();await o.query("DELETE FROM bookings WHERE id = $1",[r]),o.release();try{(0,a.bd)(r)}catch(e){console.error("WebSocket emit error:",e)}return i.NextResponse.json({message:"Booking deleted successfully"})}catch(e){return console.error("Error deleting booking:",e),i.NextResponse.json({error:"Internal server error"},{status:500})}}o()}catch(e){o(e)}})},38990:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.d(t,{N8:()=>a,n2:()=>l,vs:()=>u});var i=r(8678),n=e([i]);i=(n.then?(await n)():n)[0];let E=null;async function a(){E||((E=new i.Pool({host:process.env.DB_HOST||"192.168.1.134",port:parseInt(process.env.DB_PORT||"5432"),database:process.env.DB_NAME||"drborislavpetrov",user:process.env.DB_USER||"drborislavpetrov",password:process.env.DB_PASSWORD||"Xander123)(*",max:30,min:2,idleTimeoutMillis:6e4,connectionTimeoutMillis:3e4})).on("error",e=>{console.error("❌ Unexpected error on idle client",e)}),E.on("connect",()=>{console.log("✅ New database connection established")}));try{let e=await E.connect();return await s(e),e}catch(e){if(console.error("❌ Error connecting to database:",e),E)return console.log("\uD83D\uDD04 Attempting to recreate pool..."),await E.end(),E=null,await new Promise(e=>setTimeout(e,1e3)),a();throw e}}async function s(e){try{await e.query(`
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
      `)}catch(e){throw console.error("Error creating tables:",e),e}}function u(){return E?{totalCount:E.totalCount,idleCount:E.idleCount,waitingCount:E.waitingCount}:null}function l(e,t){console.error(`❌ Database error in ${t}:`,{message:e?.message,code:e?.code,detail:e?.detail,hint:e?.hint,where:e?.where,stack:e?.stack})}o()}catch(e){o(e)}})},64284:(e,t,r)=>{function o(){return globalThis.io?globalThis.io:(console.warn("⚠️ Socket.io not initialized yet"),null)}function i(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting booking-updated event:",e),t.to("admin").emit("booking-updated",e)):console.warn("⚠️ Socket.io not available for booking-updated event")}function n(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting booking-added event:",e),t.to("admin").emit("booking-added",e)):console.warn("⚠️ Socket.io not available for booking-added event")}function a(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting booking-deleted event:",e),t.to("admin").emit("booking-deleted",e)):console.warn("⚠️ Socket.io not available for booking-deleted event")}function s(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting user-added event:",e),t.to("admin").emit("user-added",e)):console.warn("⚠️ Socket.io not available for user-added event")}function u(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting user-updated event:",e),t.to("admin").emit("user-updated",e)):console.warn("⚠️ Socket.io not available for user-updated event")}function l(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting user-deleted event:",e),t.to("admin").emit("user-deleted",e)):console.warn("⚠️ Socket.io not available for user-deleted event")}function E(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting service-added event:",e),t.to("admin").emit("service-added",e)):console.warn("⚠️ Socket.io not available for service-added event")}function d(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting service-updated event:",e),t.to("admin").emit("service-updated",e)):console.warn("⚠️ Socket.io not available for service-updated event")}function c(e){let t=o();t?(console.log("\uD83D\uDCE1 Emitting service-deleted event:",e),t.to("admin").emit("service-deleted",e)):console.warn("⚠️ Socket.io not available for service-deleted event")}r.d(t,{Cj:()=>l,_$:()=>c,_X:()=>s,bd:()=>a,hF:()=>d,hq:()=>u,iN:()=>E,kk:()=>n,rp:()=>i})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972],()=>r(49639));module.exports=o})();