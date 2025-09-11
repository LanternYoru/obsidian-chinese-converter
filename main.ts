import { Plugin, Editor, MarkdownView } from 'obsidian';
import { Converter } from 'opencc-js';

// 定义一个类型来表示转换模式，更清晰易读
type ConversionMode = 's2t' | 't2s';

export default class ChineseConverterPlugin extends Plugin {
	private s2tConverter: (text: string) => string;
	private t2sConverter: (text: string) => string;

	// --- 新增的类属性 ---
	// 用于保存 Ribbon 图标的 HTML 元素，以便后续修改
	private ribbonIconEl: HTMLElement; 
	// 用于追踪当前的转换模式，默认是's2t'（简转繁）
	private currentMode: ConversionMode = 's2t'; 

	async onload() {
		console.log('正在加载中文简繁转换插件...');

		this.s2tConverter = await Converter({ from: 'cn', to: 't' });
		this.t2sConverter = await Converter({ from: 't', to: 'cn' });

		// --- 添加 Ribbon 图标 ---
		// 初始图标使用'languages'作为占位符，我们马上会用文字替换它
		// 点击事件绑定到 this.handleRibbonClick 方法
		this.ribbonIconEl = this.addRibbonIcon('languages', '简繁转换', () => this.handleRibbonClick());
		
		// 初始化图标的外观和提示文字
		this.updateRibbonIcon();

		// 保留之前的命令，这样用户仍然可以通过命令面板使用
		this.addCommand({
			id: 'convert-simplified-to-traditional',
			name: 'Convert Simplified to Traditional (简体转繁体)',
			editorCallback: (editor: Editor) => this.convertText(editor, 's2t'),
		});

		this.addCommand({
			id: 'convert-traditional-to-simplified',
			name: 'Convert Traditional to Simplified (繁体转简体)',
			editorCallback: (editor: Editor) => this.convertText(editor, 't2s'),
		});
	}

	onunload() {
		console.log('正在卸载中文简繁转换插件...');
	}

	/**
	 * Ribbon 图标点击事件的核心处理函数
	 */
	private handleRibbonClick() {
		// 获取当前活动的 Markdown 编辑视图
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
			// 如果存在活动的编辑器，就执行转换
			const editor = activeView.editor;
			this.convertText(editor, this.currentMode);

			// 转换完成后，切换模式
			this.currentMode = this.currentMode === 's2t' ? 't2s' : 's2t';

			// 更新图标以反映新的模式
			this.updateRibbonIcon();
		} else {
			// 如果不在编辑视图，可以给个提示
			console.log("请在笔记编辑视图下点击此按钮。");
		}
	}

	/**
	 * 更新 Ribbon 图标的显示文字和提示信息
	 */
	private updateRibbonIcon() {
		if (this.currentMode === 's2t') {
			// 如果下一次点击是“简转繁”
			this.ribbonIconEl.setText('繁'); // 设置图标显示的文字为“繁”
			this.ribbonIconEl.setAttribute('aria-label', '点击执行：简体转繁体'); // 设置鼠标悬浮提示
		} else {
			// 如果下一次点击是“繁转简”
			this.ribbonIconEl.setText('简'); // 设置图标显示的文字为“简”
			this.ribbonIconEl.setAttribute('aria-label', '点击执行：繁体转简体');
		}
	}

	/**
	 * 核心转换函数 (与之前版本基本相同)
	 * @param editor - Obsidian 编辑器对象
	 * @param conversionType - 转换类型 ('s2t' 或 't2s')
	 */
	convertText(editor: Editor, conversionType: ConversionMode) {
		const selectedText = editor.getSelection();
		let textToConvert = selectedText;

		if (!selectedText) {
			textToConvert = editor.getValue();
		}

		// 如果没有文本则不执行任何操作
		if (!textToConvert.trim()) return;

		let convertedText: string;
		if (conversionType === 's2t') {
			convertedText = this.s2tConverter(textToConvert);
		} else {
			convertedText = this.t2sConverter(textToConvert);
		}
		
		if (!selectedText) {
			editor.setValue(convertedText);
		} else {
			editor.replaceSelection(convertedText);
		}
	}
}