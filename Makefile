# Nasazení statického webu na s1.varhoo.cz.
#   make deploy

ANSIBLE ?= ansible-playbook

.PHONY: deploy

deploy:
	$(ANSIBLE) -i ansible/hosts ansible/deploy.yml
