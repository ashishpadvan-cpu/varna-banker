# main.py
from kivy.app import App
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.gridlayout import GridLayout
from kivy.uix.scrollview import ScrollView
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.popup import Popup
from kivy.uix.image import Image as KivyImage
from kivy.uix.filechooser import FileChooserIconView
from kivy.uix.modalview import ModalView
from kivy.properties import ObjectProperty
import datetime
import os
import json

DB_FILE = 'loan_entries.json'

class FileChooserPopup(ModalView):
    load = ObjectProperty(None)
    cancel = ObjectProperty(None)

    def __init__(self, **kwargs):
        super(FileChooserPopup, self).__init__(**kwargs)
        self.size_hint = (0.9, 0.9)
        layout = BoxLayout(orientation='vertical')
        self.chooser = FileChooserIconView()
        btn_layout = BoxLayout(size_hint_y=None, height=50, spacing=10)
        btn_load = Button(text='Select')
        btn_cancel = Button(text='Cancel')

        btn_load.bind(on_release=self._select)
        btn_cancel.bind(on_release=self.dismiss)

        btn_layout.add_widget(btn_load)
        btn_layout.add_widget(btn_cancel)
        layout.add_widget(self.chooser)
        layout.add_widget(btn_layout)
        self.add_widget(layout)

    def _select(self, instance):
        if self.chooser.selection:
            self.load(self.chooser.selection[0])
            self.dismiss()

class LoanForm(BoxLayout):
    def __init__(self, **kwargs):
        super().__init__(orientation='vertical', **kwargs)

        self.inputs = {}
        self.image_path = None
        self.image_widget = KivyImage(size_hint_y=None, height=200)

        search_bar = BoxLayout(size_hint_y=None, height=50, spacing=5, padding=5)
        self.search_input = TextInput(hint_text="Search by Customer Name", multiline=False)
        search_btn = Button(text="Search")
        search_btn.bind(on_release=self.search_records)
        search_bar.add_widget(self.search_input)
        search_bar.add_widget(search_btn)
        self.add_widget(search_bar)

        scroll = ScrollView()
        self.grid = GridLayout(cols=2, padding=10, spacing=10, size_hint_y=None)
        self.grid.bind(minimum_height=self.grid.setter('height'))

        self.fields = [
            "Serial Number", "Series Code", "Date (DD-MM-YYYY)", "Customer Name", "Address",
            "Phone Number", "Item", "Weight", "Amount", "Rate (in ₹)", "Days",
            "Duration", "Interest Amount", "Closing Date", "Closing Amount",
            "Vendor", "Remarks"
        ]

        for field in self.fields:
            lbl = Label(text=field, size_hint_y=None, height=40)
            ti = TextInput(size_hint_y=None, height=40, multiline=False)
            ti.bind(on_text_validate=self._focus_next)
            self.grid.add_widget(lbl)
            self.grid.add_widget(ti)
            self.inputs[field] = ti

        scroll.add_widget(self.grid)
        self.add_widget(scroll)

        self.add_widget(Label(text="Item Photo Preview:", size_hint_y=None, height=30))
        self.add_widget(self.image_widget)

        image_btns = BoxLayout(size_hint_y=None, height=50, spacing=10, padding=10)
        btn_upload = Button(text="Upload Photo")
        btn_upload.bind(on_release=self.open_file_chooser)
        image_btns.add_widget(btn_upload)

        self.add_widget(image_btns)

        button_layout = BoxLayout(size_hint_y=None, height=50, spacing=10, padding=10)
        btn_calc = Button(text="Calculate Interest")
        btn_clear = Button(text="Clear Form")
        btn_submit = Button(text="Submit")
        btn_view = Button(text="View Records")

        btn_calc.bind(on_release=self.calculate_interest)
        btn_clear.bind(on_release=self.clear_form)
        btn_submit.bind(on_release=self.submit_form)
        btn_view.bind(on_release=self.view_records)

        button_layout.add_widget(btn_calc)
        button_layout.add_widget(btn_clear)
        button_layout.add_widget(btn_submit)
        button_layout.add_widget(btn_view)

        self.add_widget(button_layout)

    def _focus_next(self, instance):
        children = list(self.inputs.values())
        if instance in children:
            idx = children.index(instance)
            if idx + 1 < len(children):
                children[idx + 1].focus = True

    def calculate_interest(self, instance):
        try:
            amount = float(self.inputs["Amount"].text)
            rate = float(self.inputs["Rate (in ₹)"].text)
            start_date = datetime.datetime.strptime(self.inputs["Date (DD-MM-YYYY)"].text, "%d-%m-%Y")
            end_date = datetime.datetime.strptime(self.inputs["Closing Date"].text, "%d-%m-%Y")

            delta = end_date - start_date
            days = delta.days
            years = days // 365
            months = (days % 365) // 30
            rem_days = (days % 365) % 30
            duration = f"{years} years {months} months {rem_days} days"

            interest = round((amount * rate * days) / (100 * 30))
            closing = round(amount + interest)

            self.inputs["Days"].text = str(days)
            self.inputs["Duration"].text = duration
            self.inputs["Interest Amount"].text = str(interest)
            self.inputs["Closing Amount"].text = str(closing)

        except Exception as e:
            self.show_popup("Error", f"Could not calculate interest: {str(e)}")

    def clear_form(self, instance):
        for input_field in self.inputs.values():
            input_field.text = ""
        self.image_widget.source = ""

    def submit_form(self, instance):
        data = {field: self.inputs[field].text for field in self.fields}
        data['Image Path'] = self.image_path or ""
        self.save_record(data)
        self.show_popup("Form Submitted", f"Saved: {data['Customer Name']} - ₹{data['Amount']}")

    def save_record(self, data):
        records = []
        if os.path.exists(DB_FILE):
            with open(DB_FILE, 'r') as f:
                try:
                    records = json.load(f)
                except json.JSONDecodeError:
                    pass
        records.append(data)
        with open(DB_FILE, 'w') as f:
            json.dump(records, f, indent=2)

    def view_records(self, instance):
        self._show_records()

    def search_records(self, instance):
        query = self.search_input.text.lower().strip()
        self._show_records(query)

    def _show_records(self, search_query=None):
        if not os.path.exists(DB_FILE):
            self.show_popup("No Records", "No previous records found.")
            return

        with open(DB_FILE, 'r') as f:
            try:
                records = json.load(f)
            except json.JSONDecodeError:
                self.show_popup("Error", "Could not read records.")
                return

        layout = BoxLayout(orientation='vertical', spacing=5)
        scroll = ScrollView(size_hint=(1, None), size=(600, 400))
        inner = GridLayout(cols=1, size_hint_y=None, spacing=5)
        inner.bind(minimum_height=inner.setter('height'))

        filtered = records
        if search_query:
            filtered = [r for r in records if search_query in r.get("Customer Name", "").lower()]

        if not filtered:
            inner.add_widget(Label(text="No matching records found."))
        else:
            for entry in filtered[-10:]:
                line = f"{entry['Serial Number']}: {entry['Customer Name']} - ₹{entry['Amount']} on {entry['Date (DD-MM-YYYY)']}"
                inner.add_widget(Label(text=line, size_hint_y=None, height=40))

        scroll.add_widget(inner)
        layout.add_widget(scroll)
        close_btn = Button(text="Close", size_hint_y=None, height=40)
        layout.add_widget(close_btn)
        popup = Popup(title="Loan Records", content=layout,
                      size_hint=(None, None), size=(650, 500))
        close_btn.bind(on_release=popup.dismiss)
        popup.open()

    def show_popup(self, title, message):
        popup = Popup(title=title,
                      content=Label(text=message),
                      size_hint=(None, None), size=(400, 200))
        popup.open()

    def open_file_chooser(self, instance):
        chooser = FileChooserPopup(load=self.load_image)
        chooser.open()

    def load_image(self, filepath):
        self.image_path = filepath
        self.image_widget.source = filepath
        self.image_widget.reload()

class VarnaBankerApp(App):
    def build(self):
        return LoanForm()

if __name__ == '__main__':
    VarnaBankerApp().run()
