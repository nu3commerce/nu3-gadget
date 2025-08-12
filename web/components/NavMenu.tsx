import { Link } from "@remix-run/react";
import { NavMenu as AppBridgeNavMenu } from "@shopify/app-bridge-react";

export function NavMenu() {
  return (
    <AppBridgeNavMenu>
      <Link to="/" rel="home">
        Dashboard
      </Link>
      <Link to="/template">
        Template Sync
      </Link>
      <Link to="/recipe-sync">
        Recipe Sync
      </Link>
    </AppBridgeNavMenu>
  );
}
