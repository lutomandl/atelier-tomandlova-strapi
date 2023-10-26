export default (_config: any, { strapi }: any) => {
  const redirects = ["/", "/index.html"].map((path) => ({
    method: "GET",
    path,
    handler: (ctx: { redirect: (arg0: string) => any }) =>
      ctx.redirect("/admin"),
    config: { auth: false },
  }));

  strapi.server.routes(redirects);
};
