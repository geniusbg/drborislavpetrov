"use strict";(()=>{var e={};e.id=319,e.ids=[319],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},9931:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>N,patchFetch:()=>l,requestAsyncStorage:()=>p,routeModule:()=>u,serverHooks:()=>d,staticGenerationAsyncStorage:()=>c});var i={};r.r(i),r.d(i,{POST:()=>E});var a=r(9303),s=r(8716),n=r(670),T=r(7070),o=r(3810);async function E(e){try{let{patientName:t,date:r,time:i,service:a=1,phone:s,email:n}=await e.json();if(!t||!r||!i)return T.NextResponse.json({error:"Липсва информация за резервацията"},{status:400});let E=await (0,o.N)(),u=s||"+359888000000",p=await E.get("SELECT * FROM users WHERE name = ?",[t]);if(p){let e=[],t=[];s&&s!==p.phone&&(e.push("phone = ?"),t.push(s)),n&&n!==p.email&&(e.push("email = ?"),t.push(n)),e.length>0&&(t.push(p.id),await E.run(`UPDATE users SET ${e.join(", ")} WHERE id = ?`,t),s&&(p.phone=s),n&&(p.email=n),console.log("Updated user via Siri:",p))}else p={id:(await E.run(`
        INSERT INTO users (name, phone, email)
        VALUES (?, ?, ?)
      `,[t,u,n||null])).lastID,name:t,phone:u,email:n||null},console.log("Created new user via Siri:",p);if(await E.get(`
      SELECT * FROM bookings 
      WHERE date = ? AND time = ? AND status != 'cancelled'
    `,[r,i]))return T.NextResponse.json({error:`Този час (${i}) на ${r} вече е зает`},{status:409});let c=await E.run(`
      INSERT INTO bookings (name, phone, service, date, time, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `,[t,p.phone,a,r,i]);return T.NextResponse.json({success:!0,message:`Резервацията за ${t} на ${r} в ${i} е създадена успешно`,bookingId:c.lastID})}catch(e){return console.error("Siri create booking error:",e),T.NextResponse.json({error:"Възникна грешка при създаване на резервацията"},{status:500})}}let u=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/siri/create-booking/route",pathname:"/api/siri/create-booking",filename:"route",bundlePath:"app/api/siri/create-booking/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\siri\\create-booking\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:p,staticGenerationAsyncStorage:c,serverHooks:d}=u,N="/api/siri/create-booking/route";function l(){return(0,n.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:c})}},3810:(e,t,r)=>{r.d(t,{N:()=>T});let i=require("sqlite3");var a=r.n(i),s=r(6360);let n=null;async function T(){return n||(n=await (0,s.bA)({filename:"./bookings.db",driver:a().Database}),await n.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        service INTEGER NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),await n.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT UNIQUE NOT NULL,
        address TEXT,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),await n.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),0===(await n.get("SELECT COUNT(*) as count FROM services")).count&&await n.exec(`
        INSERT INTO services (name, description, duration, price) VALUES
        ('Преглед и консултация', 'Основен преглед на зъбите и консултация', 30, 50.00),
        ('Почистване и профилактика', 'Професионално почистване на зъбен камък', 45, 80.00),
        ('Лечение на кариес', 'Лечение на кариес с модерни материали', 60, 120.00),
        ('Отбелязване', 'Професионално отбелязване на зъбите', 90, 200.00),
        ('Ортодонтия', 'Консултация за ортодонтски лечение', 45, 100.00)
      `)),n}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[948,972,360],()=>r(9931));module.exports=i})();