"use strict";(()=>{var e={};e.id=487,e.ids=[487],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},582:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>v,patchFetch:()=>L,requestAsyncStorage:()=>p,routeModule:()=>N,serverHooks:()=>A,staticGenerationAsyncStorage:()=>R});var s={};t.r(s),t.d(s,{DELETE:()=>d,GET:()=>E,POST:()=>u,PUT:()=>c});var n=t(9303),a=t(8716),i=t(670),o=t(7070),T=t(3810);async function E(e){try{if(!e.headers.get("x-admin-token"))return o.NextResponse.json({error:"Unauthorized"},{status:401});let r=await (0,T.N)(),t=await r.all("SELECT * FROM services ORDER BY name");return o.NextResponse.json({services:t})}catch(e){return o.NextResponse.json({error:"Internal server error"},{status:500})}}async function u(e){try{if(!e.headers.get("x-admin-token"))return o.NextResponse.json({error:"Unauthorized"},{status:401});let{name:r,description:t,duration:s,price:n}=await e.json(),a=await (0,T.N)(),i=await a.run(`
      INSERT INTO services (name, description, duration, price)
      VALUES (?, ?, ?, ?)
    `,[r,t,s,n]),E=await a.get("SELECT * FROM services WHERE id = ?",[i.lastID]);return o.NextResponse.json({success:!0,service:E})}catch(e){return o.NextResponse.json({error:"Internal server error"},{status:500})}}async function c(e){try{if(!e.headers.get("x-admin-token"))return o.NextResponse.json({error:"Unauthorized"},{status:401});let{id:r,name:t,description:s,duration:n,price:a,isActive:i}=await e.json(),E=await (0,T.N)(),u=await E.run(`
      UPDATE services 
      SET name = ?, description = ?, duration = ?, price = ?, isActive = ?
      WHERE id = ?
    `,[t,s,n,a,i?1:0,r]);if(0===u.changes)return o.NextResponse.json({error:"Service not found"},{status:404});let c=await E.get("SELECT * FROM services WHERE id = ?",[r]);return o.NextResponse.json({success:!0,service:c})}catch(e){return o.NextResponse.json({error:"Internal server error"},{status:500})}}async function d(e){try{if(!e.headers.get("x-admin-token"))return o.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:r}=new URL(e.url),t=r.get("id");if(!t)return o.NextResponse.json({error:"Service ID required"},{status:400});let s=await (0,T.N)(),n=await s.run("DELETE FROM services WHERE id = ?",[t]);if(0===n.changes)return o.NextResponse.json({error:"Service not found"},{status:404});return o.NextResponse.json({success:!0})}catch(e){return o.NextResponse.json({error:"Internal server error"},{status:500})}}let N=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/admin/services/route",pathname:"/api/admin/services",filename:"route",bundlePath:"app/api/admin/services/route"},resolvedPagePath:"C:\\Users\\genius\\Downloads\\drborislavpetrov\\src\\app\\api\\admin\\services\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:p,staticGenerationAsyncStorage:R,serverHooks:A}=N,v="/api/admin/services/route";function L(){return(0,i.patchFetch)({serverHooks:A,staticGenerationAsyncStorage:R})}},3810:(e,r,t)=>{t.d(r,{N:()=>o});let s=require("sqlite3");var n=t.n(s),a=t(6360);let i=null;async function o(){return i||(i=await (0,a.bA)({filename:"./bookings.db",driver:n().Database}),await i.exec(`
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
      `)),i}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[948,972,360],()=>t(582));module.exports=s})();