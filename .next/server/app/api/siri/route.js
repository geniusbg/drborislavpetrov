"use strict";(()=>{var e={};e.id=568,e.ids=[568],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6796:(e,s,t)=>{t.r(s),t.d(s,{originalPathname:()=>l,patchFetch:()=>m,requestAsyncStorage:()=>R,routeModule:()=>d,serverHooks:()=>I,staticGenerationAsyncStorage:()=>A});var a={};t.r(a),t.d(a,{POST:()=>E});var r=t(9303),n=t(8716),i=t(670),o=t(7070),T=t(3810);async function E(e){try{let{action:s,data:t}=await e.json(),a=await (0,T.N)();switch(s){case"create_booking":return await u(t,a);case"confirm_booking":return await c(t,a);case"cancel_booking":return await N(t,a);case"get_bookings":return await p(a);default:return o.NextResponse.json({error:"Неизвестно действие"},{status:400})}}catch(e){return console.error("Siri API error:",e),o.NextResponse.json({error:"Възникна грешка"},{status:500})}}async function u(e,s){let{patientName:t,date:a,time:r,service:n}=e;if(!t||!a||!r)return o.NextResponse.json({error:"Липсва информация за резервацията"},{status:400});let i=await s.get("SELECT * FROM users WHERE name = ?",[t]);if(i||(i={id:(await s.run(`
      INSERT INTO users (name, phone)
      VALUES (?, ?)
    `,[t,"+359888000000"])).lastID,name:t,phone:"+359888000000"}),await s.get(`
    SELECT * FROM bookings 
    WHERE date = ? AND time = ? AND status != 'cancelled'
  `,[a,r]))return o.NextResponse.json({error:`Този час (${r}) на ${a} вече е зает`},{status:409});let T=await s.run(`
    INSERT INTO bookings (name, phone, service, date, time, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `,[t,i.phone,n||1,a,r]);return o.NextResponse.json({success:!0,message:`Резервацията за ${t} на ${a} в ${r} е създадена успешно`,bookingId:T.lastID})}async function c(e,s){let{bookingId:t}=e;return t?(await s.run("UPDATE bookings SET status = ? WHERE id = ?",["confirmed",t]),o.NextResponse.json({success:!0,message:"Резервацията е потвърдена успешно"})):o.NextResponse.json({error:"ID на резервацията е задължително"},{status:400})}async function N(e,s){let{bookingId:t}=e;return t?(await s.run("UPDATE bookings SET status = ? WHERE id = ?",["cancelled",t]),o.NextResponse.json({success:!0,message:"Резервацията е отменена успешно"})):o.NextResponse.json({error:"ID на резервацията е задължително"},{status:400})}async function p(e){let s=await e.all(`
    SELECT b.*, s.name as serviceName, u.name as userName
    FROM bookings b
    LEFT JOIN services s ON b.service = s.id
    LEFT JOIN users u ON b.phone = u.phone
    WHERE b.status = 'pending'
    ORDER BY b.createdAt DESC
    LIMIT 10
  `);return o.NextResponse.json({success:!0,bookings:s.map(e=>({id:e.id,patientName:e.name,service:e.serviceName,date:e.date,time:e.time,status:e.status}))})}let d=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/siri/route",pathname:"/api/siri",filename:"route",bundlePath:"app/api/siri/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\siri\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:R,staticGenerationAsyncStorage:A,serverHooks:I}=d,l="/api/siri/route";function m(){return(0,i.patchFetch)({serverHooks:I,staticGenerationAsyncStorage:A})}},3810:(e,s,t)=>{t.d(s,{N:()=>o});let a=require("sqlite3");var r=t.n(a),n=t(6360);let i=null;async function o(){return i||(i=await (0,n.bA)({filename:"./bookings.db",driver:r().Database}),await i.exec(`
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
    `),await i.exec(`
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
    `),await i.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),0===(await i.get("SELECT COUNT(*) as count FROM services")).count&&await i.exec(`
        INSERT INTO services (name, description, duration, price) VALUES
        ('Преглед и консултация', 'Основен преглед на зъбите и консултация', 30, 50.00),
        ('Почистване и профилактика', 'Професионално почистване на зъбен камък', 45, 80.00),
        ('Лечение на кариес', 'Лечение на кариес с модерни материали', 60, 120.00),
        ('Отбелязване', 'Професионално отбелязване на зъбите', 90, 200.00),
        ('Ортодонтия', 'Консултация за ортодонтски лечение', 45, 100.00)
      `)),i}}};var s=require("../../../webpack-runtime.js");s.C(e);var t=e=>s(s.s=e),a=s.X(0,[948,972,360],()=>t(6796));module.exports=a})();