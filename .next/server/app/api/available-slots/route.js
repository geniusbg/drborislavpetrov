"use strict";(()=>{var e={};e.id=624,e.ids=[624],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},7949:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>c,patchFetch:()=>N,requestAsyncStorage:()=>l,routeModule:()=>d,serverHooks:()=>p,staticGenerationAsyncStorage:()=>u});var a={};r.r(a),r.d(a,{GET:()=>E});var s=r(9303),i=r(8716),n=r(670),T=r(7070),o=r(3810);async function E(e){try{let{searchParams:t}=new URL(e.url),r=t.get("date"),a=t.get("serviceId");if(!r||!a)return T.NextResponse.json({error:"Date and serviceId are required"},{status:400});let s=await (0,o.N)(),i=await s.get("SELECT duration FROM services WHERE id = ?",[a]);if(!i)return T.NextResponse.json({error:"Service not found"},{status:404});let n=await s.all(`
      SELECT time, duration 
      FROM bookings b
      JOIN services s ON b.service = s.id
      WHERE b.date = ? AND b.status != 'cancelled'
    `,[r]),E={start:9,end:18,breakStart:12,breakEnd:13},d=[];for(let e=E.start;e<E.end;e++)e>=E.breakStart&&e<E.breakEnd||(d.push(`${e.toString().padStart(2,"0")}:00`),d.push(`${e.toString().padStart(2,"0")}:30`));let l=new Set;n.forEach(e=>{let t=e.time,r=e.duration||30,a=60*parseInt(t.split(":")[0])+parseInt(t.split(":")[1]);for(let e=0;e<r;e+=30){let t=a+e,r=Math.floor(t/60),s=t%60,i=`${r.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;l.add(i)}});let u=d.filter(e=>!l.has(e));return T.NextResponse.json({availableSlots:u,serviceDuration:i.duration})}catch(e){return console.error("Error getting available slots:",e),T.NextResponse.json({error:"Internal server error"},{status:500})}}let d=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/available-slots/route",pathname:"/api/available-slots",filename:"route",bundlePath:"app/api/available-slots/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\available-slots\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:l,staticGenerationAsyncStorage:u,serverHooks:p}=d,c="/api/available-slots/route";function N(){return(0,n.patchFetch)({serverHooks:p,staticGenerationAsyncStorage:u})}},3810:(e,t,r)=>{r.d(t,{N:()=>T});let a=require("sqlite3");var s=r.n(a),i=r(6360);let n=null;async function T(){return n||(n=await (0,i.bA)({filename:"./bookings.db",driver:s().Database}),await n.exec(`
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
      `)),n}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[948,972,360],()=>r(7949));module.exports=a})();