# --- RED ---
resource "oci_core_vcn" "portfolio_vcn" {
  cidr_block     = "10.0.0.0/16"
  compartment_id = var.compartment_ocid
  display_name   = "portfolio-vcn"
}

resource "oci_core_internet_gateway" "portfolio_igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio_vcn.id
  display_name   = "portfolio-igw"
}

resource "oci_core_route_table" "portfolio_rt" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio_vcn.id
  display_name   = "portfolio-rt"
  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.portfolio_igw.id
  }
}

resource "oci_core_security_list" "portfolio_sl" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio_vcn.id
  display_name   = "portfolio-security-list"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  dynamic "ingress_security_rules" {
    for_each = [22, 80, 443, 8000]
    content {
      source   = "0.0.0.0/0"
      protocol = "6"
      tcp_options {
        max = ingress_security_rules.value
        min = ingress_security_rules.value
      }
    }
  }
}

resource "oci_core_subnet" "portfolio_subnet" {
  cidr_block        = "10.0.1.0/24"
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.portfolio_vcn.id
  route_table_id    = oci_core_route_table.portfolio_rt.id
  security_list_ids = [oci_core_security_list.portfolio_sl.id]
  display_name      = "portfolio-public-subnet"
}

# --- IMAGEN Y CÓMPUTO ---
data "oci_core_images" "ubuntu_linux" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

resource "oci_core_instance" "portfolio_vm" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "portfolio-web-server"

  shape = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 4
    memory_in_gbs = 24
  }

  source_details {
    source_id   = data.oci_core_images.ubuntu_linux.images[0].id
    source_type = "image"
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.portfolio_subnet.id
    assign_public_ip = true
  }

  metadata = {
    user_data = base64encode(<<-EOF
      #!/bin/bash
      set -e
      # PRIMERO: deployer + SSH (para que deploy.sh pueda conectar en ~30s)
      useradd -m -s /bin/bash deployer
      mkdir -p /home/deployer/.ssh
      echo '${base64encode(var.ssh_public_key)}' | base64 -d >> /home/deployer/.ssh/authorized_keys
      chown -R deployer:deployer /home/deployer/.ssh
      chmod 700 /home/deployer/.ssh
      chmod 600 /home/deployer/.ssh/authorized_keys
      echo "deployer ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/deployer
      chmod 440 /etc/sudoers.d/deployer

      # Instalación de Docker para Ubuntu (https://docs.docker.com/engine/install/ubuntu/)
      apt-get update
      apt-get install -y ca-certificates curl gnupg
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
      chmod a+r /etc/apt/keyrings/docker.asc
      echo "deb [arch=$$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $$(. /etc/os-release && echo "$$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
      apt-get update
      apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      systemctl enable --now docker
      usermod -aG docker deployer

      # Firewall (ufw)
      ufw allow 22/tcp
      ufw allow 80/tcp
      ufw allow 443/tcp
      ufw allow 8000/tcp
      ufw --force enable
    EOF
    )
  }
}
