terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 4.0.0"
    }
  }
  
  # Backend Nativo de OCI
  backend "oci" {
    bucket    = "terraform-state"
    namespace = "axve8yqvxrx5" 
    # La autenticación se pasará dinámicamente desde GitHub Actions
  }
}

provider "oci" {
   tenancy_ocid     = var.tenancy_ocid
   user_ocid       = var.user_ocid
   fingerprint     = var.fingerprint
   private_key = var.oci_private_key
   region          = var.region
}