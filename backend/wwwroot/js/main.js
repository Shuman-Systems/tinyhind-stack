(()=>{var i=class{baseUrl;tenantId;constructor(t,n=""){this.baseUrl=n,this.tenantId=t}async registerTable(t,n){let e=await fetch(`${this.baseUrl}/rune/${this.tenantId}/register/${t}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)});if(!e.ok)throw new Error(`[Register Table] Server responded with ${e.status}: ${await e.text()}`);return e.text()}async insertRecord(t,n){let e=await fetch(`${this.baseUrl}/call/${this.tenantId}/${t}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)});if(!e.ok)throw new Error(`[Insert Record] Server responded with ${e.status}`);return e.json()}async getRecordById(t,n){let e=await fetch(`${this.baseUrl}/call/${this.tenantId}/${t}/${n}`);if(!e.ok)throw new Error(`[Get Record] Server responded with ${e.status}`);return e.json()}async updateRecord(t,n,e){let o=await fetch(`${this.baseUrl}/call/${this.tenantId}/${t}/${n}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!o.ok)throw new Error(`[Update Record] Server responded with ${o.status}`);return o.text()}async queryRecords(t){let n=await fetch(`${this.baseUrl}/call/${this.tenantId}/query`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!n.ok)throw new Error(`[Query Records] Server responded with ${n.status}`);return n.json()}};var m="http://localhost:5087",d="d95cc89b-e287-47d0-996a-508df06d520f",r=document.getElementById("output");async function y(){r.textContent=`Using static Tenant ID: ${d}

`;let s=new i(m,d);try{r.textContent+=`Step 1: Registering 'Users' table...
`;let t={properties:{name:{type:"string"},email:{type:"string"},age:{type:"integer"}},required:["name","email"]},n=await s.registerTable("Users",t);r.textContent+=`SUCCESS: ${n}

`,r.textContent+=`Step 2: Inserting a new user...
`;let e={name:"Catherine",email:"catherine@example.com",age:25},a=(await s.insertRecord("Users",e)).id;r.textContent+=`SUCCESS: Record created with ID: ${a}

`,r.textContent+=`Step 3: Fetching user with ID ${a}...
`;let h=await s.getRecordById("Users",a);r.textContent+=`SUCCESS: Fetched user data:
${JSON.stringify(h,null,2)}

`,r.textContent+=`Step 4: Updating user ${a} with age 26...
`;let u={age:26},l=await s.updateRecord("Users",a,u);r.textContent+=`SUCCESS: ${l}

`,r.textContent+=`Step 5: Re-fetching user ${a} to verify age change...
`;let p=await s.getRecordById("Users",a);r.textContent+=`SUCCESS: Fetched updated user data:
${JSON.stringify(p,null,2)}

`,r.textContent+=`Step 6: Querying for user with email 'catherine@example.com'...
`;let S={from:"Users",select:["Id","name","age"],where:{email:{eq:"catherine@example.com"}}},c=await s.queryRecords(S);r.textContent+=`SUCCESS: Query found ${c.length} record(s):
${JSON.stringify(c,null,2)}

`,r.textContent+="All tests complete!"}catch(t){r.textContent+=`
--- ERROR ---
${t.message}

`}}y();})();
