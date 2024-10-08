const { SlashCommandBuilder } = require('discord.js');
const { format, buttons, getItem, specialArg } = require('../../utils/functions.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('exchange')
		.setNameLocalizations({
			'pt-BR': 'troca',
			'es-ES': 'intercambio',
		})
		.setDescription('Exchange gCoins and items with other users')
		.setDescriptionLocalizations({
			'pt-BR': 'Troque gCoins e itens com outros usuários',
			'es-ES': 'Intercambia gCoins e items con otros usuarios',
		})
		.setDMPermission(false)
		.addUserOption((option) =>
			option
				.setName('user')
				.setNameLocalizations({
					'pt-BR': 'usuário',
					'es-ES': 'usuario',
				})
				.setDescription('The user to trade with')
				.setDescriptionLocalizations({
					'pt-BR': 'Com quem você quer trocar',
					'es-ES': 'Con quien quieres intercambiar',
				})
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('give')
				.setNameLocalizations({
					'pt-BR': 'oferecer',
					'es-ES': 'ofrecer',
				})
				.setDescription('The items or gCoins to give separated by commas (ex: 1000 gCoins, 1 rock, 10 fish)')
				.setDescriptionLocalizations({
					'pt-BR': 'Os itens ou gCoins para oferecer separados por vírgulas (ex: 1000 gCoins, 1 pedra)',
					'es-ES': 'Los items o gCoins para ofrecer separados por comas (ex: 1000 gCoins, 1 piedra)',
				})
				.setRequired(true)
				.setMaxLength(100)
		)
		.addStringOption((option) =>
			option
				.setName('receive')
				.setNameLocalizations({
					'pt-BR': 'receber',
					'es-ES': 'recibir',
				})
				.setDescription('The items or gCoins to receive separated by commas (ex: 1000 gcoins, 1 rock, 10 fish)')
				.setDescriptionLocalizations({
					'pt-BR': 'Os itens ou gCoins para receber separados por vírgulas (ex: 1000 gcoins, 1 pedra)',
					'es-ES': 'Los items o gCoins para recibir separados por comas (ex: 1000 gcoins, 1 piedra)',
				})
				.setRequired(true)
				.setMaxLength(100)
		),
	execute: async ({ guild, interaction, user, member, instance, database }) => {
		await interaction.deferReply().catch(() => {});
		try {
			const offer = interaction.options.getString('give');
			const receive = interaction.options.getString('receive');
			var recipient = await guild.members.fetch(interaction.options.getUser('user').id);
			const recipientFile = await database.player.findOne(recipient.user.id);
			const userFile = await database.player.findOne(user.id);

			if (recipient.user === user) {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'CANT_EXCHANGE_ALONE'),
				});
				return;
			}

			//separate the items and gcoins the user wants to give, they are separated by commas
			var offerItems = offer.split(',');
			var offerGcoins = 0;
			var offerItemsNames = [];
			var offerItemsAmount = [];

			//separate the items and gcoins the user wants to receive, they are separated by commas
			var receiveItems = receive.split(',');
			var receiveGcoins = 0;
			var receiveItemsNames = [];
			var receiveItemsAmount = [];

			//separate the gcoins from the items
			for (var i = 0; i < offerItems.length; i++) {
				if (offerItems[i].includes('gcoins')) {
					offerGcoins = specialArg(offerItems[i].split(' ')[0], userFile.gcoins);
				} else {
					offerItems[i] = offerItems[i].trim();
					var itemName = getItem(offerItems[i].split(' ').slice(1).join(' '));
					if (getItem(itemName) === undefined) {
						await instance.editReply(interaction, {
							content: instance.getMessage(interaction, 'BAD_VALUE', {
								VALUE: offerItems[i].split(' ')[1],
							}),
						});
						return;
					}
					try {
						offerItemsNames.push(itemName);
						offerItemsAmount.push(specialArg(offerItems[i].split(' ')[0], userFile.inventory.get(itemName)));
					} catch {
						await instance.editReply(interaction, {
							content: instance.getMessage(interaction, 'BAD_VALUE', {
								VALUE: offerItems[i],
							}),
						});
						return;
					}
				}
			}

			//separate the gcoins from the items
			for (var i = 0; i < receiveItems.length; i++) {
				if (receiveItems[i].includes('gcoins')) {
					receiveGcoins = specialArg(receiveItems[i].split(' ')[0], recipientFile.gcoins);
				} else {
					receiveItems[i] = receiveItems[i].trim();
					var itemName = getItem(receiveItems[i].split(' ').slice(1).join(' '));
					if (itemName === undefined) {
						await instance.editReply(interaction, {
							content: instance.getMessage(interaction, 'BAD_VALUE', {
								VALUE: receiveItems[i].split(' ')[1],
							}),
						});
						return;
					}
					try {
						receiveItemsNames.push(itemName);
						receiveItemsAmount.push(specialArg(receiveItems[i].split(' ')[0], recipientFile.inventory.get(itemName)));
					} catch {
						await instance.editReply(interaction, {
							content: instance.getMessage(interaction, 'BAD_VALUE', {
								VALUE: receiveItems[i],
							}),
						});
						return;
					}
				}
			}

			//check if the user has the items and gcoins to give
			if (offerGcoins > userFile.gcoins || receiveGcoins > recipientFile.gcoins) {
				await instance.editReply(interaction, {
					content: instance.getMessage(interaction, 'INSUFFICIENT_ACCOUNTS'),
				});
				return;
			}

			const offerFormated = [offerGcoins ? `**${format(offerGcoins)}** :coin: gCoins` : ''];
			for (var i = 0; i < offerItemsNames.length; i++) {
				if (userFile.inventory.get(offerItemsNames[i]) < offerItemsAmount[i]) {
					await instance.editReply(interaction, {
						content: instance.getMessage(interaction, 'INSUFICIENT_ITEM_EXCHANGE', {
							USER: member,
							ITEM: instance.getItemName(offerItemsNames[i], interaction),
						}),
					});
					return;
				}
				offerFormated.push(`${offerItemsAmount[i]} x ${instance.getItemName(offerItemsNames[i], interaction)}`);
			}

			const receiveFormated = [receiveGcoins ? `**${format(receiveGcoins)}** :coin: gCoins` : ''];
			for (var i = 0; i < receiveItemsNames.length; i++) {
				if (recipientFile.inventory.get(receiveItemsNames[i]) < receiveItemsAmount[i]) {
					await instance.editReply(interaction, {
						content: instance.getMessage(interaction, 'INSUFICIENT_ITEM_EXCHANGE', {
							USER: recipient,
							ITEM: instance.getItemName(receiveItemsNames[i], interaction),
						}),
					});
					return;
				}
				receiveFormated.push(`${receiveItemsAmount[i]} x ${instance.getItemName(receiveItemsNames[i], interaction)}`);
			}

			//create the message to send to the user
			const embed = instance.createEmbed(member.displayColor);
			embed.setTitle(
				instance.getMessage(interaction, 'EXCHANGE_PROPOSAL', {
					USER: member.displayName,
					USER2: recipient.displayName,
				})
			);
			embed.addFields(
				{
					name: instance.getMessage(interaction, 'OFFER', {
						USER: member.displayName,
					}),
					value: offerFormated.join('\n'),
					inline: true,
				},
				{
					name: instance.getMessage(interaction, 'RECEIVE'),
					value: receiveFormated.join('\n'),
					inline: true,
				}
			);

			var answer = await instance.editReply(interaction, {
				embeds: [embed],
				components: [buttons(['accept', 'refuse'])],
				fetchReply: true,
			});

			const filter = (btInt) => {
				return instance.defaultFilter(btInt) && btInt.user.id === recipient.user.id;
			};

			const collector = answer.createMessageComponentCollector({
				filter,
				max: 1,
				time: 1000 * 300,
			});

			collector.on('end', async (collected) => {
				if (collected.size === 0) {
					instance.editReply(interaction, {
						content: instance.getMessage(interaction, 'EXCHANGE_CANCELLED', {
							USER: recipient,
						}),
						embeds: [],
						components: [],
					});
				} else if (collected.first().customId === 'refuse') {
					embed.setTitle(
						instance.getMessage(interaction, 'EXCHANGE_REFUSED', {
							USER: member.displayName,
							USER2: recipient.displayName,
						})
					);

					instance.editReply(interaction, {
						embeds: [embed],
						components: [],
					});
				} else {
					userFile.gcoins -= offerGcoins;
					recipientFile.gcoins -= receiveGcoins;
					userFile.gcoins += receiveGcoins;
					recipientFile.gcoins += offerGcoins;

					for (var i = 0; i < offerItemsNames.length; i++) {
						userFile.inventory.set(
							offerItemsNames[i],
							(userFile.inventory.get(offerItemsNames[i]) ?? 0) - offerItemsAmount[i]
						);
						recipientFile.inventory.set(
							offerItemsNames[i],
							(recipientFile.inventory.get(offerItemsNames[i]) ?? 0) + offerItemsAmount[i]
						);
					}

					for (var i = 0; i < receiveItemsNames.length; i++) {
						recipientFile.inventory.set(
							receiveItemsNames[i],
							(recipientFile.inventory.get(receiveItemsNames[i]) ?? 0) - receiveItemsAmount[i]
						);
						userFile.inventory.set(
							receiveItemsNames[i],
							(userFile.inventory.get(receiveItemsNames[i]) ?? 0) + receiveItemsAmount[i]
						);
					}

					const embed = instance.createEmbed(member.displayColor);
					embed.setTitle(
						instance.getMessage(interaction, 'EXCHANGE_ACCEPTED', {
							USER: member.displayName,
							USER2: recipient.displayName,
						})
					);

					embed.addFields(
						{
							name: instance.getMessage(interaction, 'OFFER', {
								USER: member.displayName,
							}),
							value: offerFormated.join('\n'),
							inline: true,
						},
						{
							name: instance.getMessage(interaction, 'RECEIVE'),
							value: receiveFormated.join('\n'),
							inline: true,
						}
					);

					instance.editReply(interaction, {
						embeds: [embed],
						components: [],
					});
				}
			});
			userFile.save();
			recipientFile.save();
		} catch (error) {
			console.error(`exchange: ${error}`);
			instance.editReply(interaction, {
				content: instance.getMessage(interaction, 'EXCEPTION'),
			});
		}
	},
};
